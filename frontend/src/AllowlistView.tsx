// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import {
  useSignPersonalMessage,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import { AlertDialog, Button, Card, Dialog, Flex, Grid } from '@radix-ui/themes';
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { KeyServerConfig, SealClient, SessionKey, type ExportedSessionKey } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import { downloadAndDecrypt, getObjectExplorerLink, MoveCallConstructor } from './utils';
import { set, get } from 'idb-keyval';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const TTL_MIN = 10;

export interface FeedData {
  allowlistId: string;
  allowlistName: string;
  blobIds: string[];
}

function constructMoveCall(packageId: string, allowlistId: string): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: `${packageId}::allowlist::seal_approve`,
      arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(allowlistId)],
    });
  };
}

const Feeds: React.FC<{ suiAddress: string }> = ({ suiAddress }) => {
  const suiClient = useSuiClient();
  const serverObjectIds = [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
  ];
  const client = new SealClient({
    suiClient,
    serverConfigs: serverObjectIds.map((id) => ({ objectId: id, weight: 1 })) as KeyServerConfig[],
    verifyKeyServers: false,
  });

  const packageId = useNetworkVariable('packageId');
  // const mvrName = useNetworkVariable('mvrName');

  const [feed, setFeed] = useState<FeedData>();
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasSigned, setHasSigned] = useState(false); // ✅ NEW STATE

  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  useEffect(() => {
    refresh();
    const intervalId = setInterval(() => refresh(), 3000);
    return () => clearInterval(intervalId);
  }, [id, suiClient, packageId]);

  async function refresh() {
    await getFeed();
    await getSignedStatus(); // <-- check signer status on page load & every poll
  }

  async function getFeed() {
    const allowlist = await suiClient.getObject({
      id: id!,
      options: { showContent: true },
    });

    const encryptedObjects = await suiClient
      .getDynamicFields({ parentId: id! })
      .then((res: { data: any[] }) => res.data.map((obj) => obj.name.value as string));

    const fields = (allowlist.data?.content as { fields: any })?.fields || {};
    setFeed({
      allowlistId: id!,
      allowlistName: fields?.name,
      blobIds: encryptedObjects,
    });
  }

  const onView = async (blobIds: string[], allowlistId: string) => {
    const imported: ExportedSessionKey = await get('sessionKey');

    if (imported) {
      try {
        const currentSessionKey = await SessionKey.import(
          imported,
          new SuiClient({ url: getFullnodeUrl('testnet') }),
        );
        if (
          currentSessionKey &&
          !currentSessionKey.isExpired() &&
          currentSessionKey.getAddress() === suiAddress
        ) {
          const moveCallConstructor = constructMoveCall(packageId, allowlistId);
          downloadAndDecrypt(
            blobIds,
            currentSessionKey,
            suiClient,
            client,
            moveCallConstructor,
            setError,
            setDecryptedFileUrls,
            setIsDialogOpen,
            setReloadKey,
          );
          return;
        }
      } catch {
        // fallthrough
      }
    }

    set('sessionKey', null);

    const sessionKey = await SessionKey.create({
      address: suiAddress,
      packageId,
      ttlMin: TTL_MIN,
      suiClient,
      // mvrName,
    });

    try {
      signPersonalMessage(
        { message: sessionKey.getPersonalMessage() },
        {
          onSuccess: async (result: { signature: string }) => {
            await sessionKey.setPersonalMessageSignature(result.signature);
            const moveCallConstructor = constructMoveCall(packageId, allowlistId);
            await downloadAndDecrypt(
              blobIds,
              sessionKey,
              suiClient,
              client,
              moveCallConstructor,
              setError,
              setDecryptedFileUrls,
              setIsDialogOpen,
              setReloadKey,
            );
            set('sessionKey', sessionKey.export());
          },
        },
      );
    } catch (error: any) {
      console.error('Error:', error);
    }
  };

  // ---- NEW: read allowlist.signed Table<address,bool> for the current user
  async function getSignedStatus() {
    try {
      if (!id || !suiAddress) {
        setHasSigned(false);
        return;
      }

      // fetch allowlist to get the table object id for `signed`
      const allowlistObj = await suiClient.getObject({
        id,
        options: { showContent: true },
      });
      const fields = (allowlistObj.data?.content as any)?.fields;

      // Table<address, bool> is an object with an inner id (handle). Common path:
      // fields.signed.fields.id.id
      const signedTableId: string | undefined = fields?.signed?.fields?.id?.id;
      if (!signedTableId) {
        setHasSigned(false);
        return;
      }

      // Try to fetch DF entry for key = address
      // If no entry exists, this throws; we catch and treat as false.
      const entry = await suiClient.getDynamicFieldObject({
        parentId: signedTableId,
        name: {
          type: 'address',
          value: suiAddress, // must be 0x-prefixed
        },
      });

      // Extract bool from returned object (shape varies slightly by SDK version)
      const rawVal = (entry as any)?.data?.content?.fields?.value;
      const value =
        typeof rawVal === 'boolean'
          ? rawVal
          : typeof rawVal?.fields?.value === 'boolean'
            ? rawVal.fields.value
            : false;

      setHasSigned(!!value);
    } catch {
      // no DF entry for this address => not signed yet
      setHasSigned(false);
    }
  }

  // Single allowlist-level sign (signdoc)
  async function onSignAllowlist(allowlistId: string) {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::signdoc`,
        arguments: [tx.pure.vector('u8', fromHex(allowlistId)), tx.object(allowlistId)],
      });
      const res = await signAndExecute({ transaction: tx, chain: 'sui:testnet' });
      console.log('signdoc digest:', res.digest);

      // ✅ Update UI
      setHasSigned(true);
    } catch (e: any) {
      console.error('signdoc failed:', e);
      setError(e?.message ?? 'Failed to sign.');
    }
  }

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>
        Files for SuiSign {feed?.allowlistName} (ID{' '}
        {feed?.allowlistId && getObjectExplorerLink(feed.allowlistId)})
      </h2>

      {feed === undefined ? (
        <p>No files found for this SuiSign.</p>
      ) : (
        <Grid columns="2" gap="3">
          {/* Left block */}
          <Card key={`${feed!.allowlistId}-download`}>
            <Flex direction="column" align="start" gap="2">
              {feed!.blobIds.length === 0 ? (
                <p>No files found for this SuiSign.</p>
              ) : (
                <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <Dialog.Trigger>
                    <Button onClick={() => onView(feed!.blobIds, feed!.allowlistId)}>
                      Download And Decrypt All Files
                    </Button>
                  </Dialog.Trigger>
                  {decryptedFileUrls.length > 0 && (
                    <Dialog.Content maxWidth="450px" key={reloadKey}>
                      <Dialog.Title>View all files retrieved from Walrus</Dialog.Title>
                      <Flex direction="column" gap="2">
                        {decryptedFileUrls.map((decryptedFileUrl, index) => (
                          <div key={index}>
                            <img src={decryptedFileUrl} alt={`Decrypted image ${index + 1}`} />
                          </div>
                        ))}
                      </Flex>
                      <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                          <Button
                            variant="soft"
                            color="gray"
                            onClick={() => setDecryptedFileUrls([])}
                          >
                            Close
                          </Button>
                        </Dialog.Close>
                      </Flex>
                    </Dialog.Content>
                  )}
                </Dialog.Root>
              )}
            </Flex>
          </Card>

          {/* Right block */}
          <Card key={`${feed!.allowlistId}-sign`}>
            <Flex direction="column" align="start" gap="2">
              <h3 style={{ marginBottom: '0.5rem' }}>Sign This SuiSign</h3>
              <p style={{ opacity: 0.8, marginBottom: '0.5rem' }}>
                Please note that your signature applies to the all documents within this SuiSign
                (not individual files) and is immutable.
              </p>

              {/* ✅ Toggle button based on hasSigned */}
              {hasSigned ? (
                <Button disabled color="green" variant="soft">
                  Signed ✅
                </Button>
              ) : (
                <Button
                  color="indigo"
                  variant="soft"
                  onClick={() => onSignAllowlist(feed!.allowlistId)}
                >
                  Sign
                </Button>
              )}
            </Flex>
          </Card>
        </Grid>
      )}

      <AlertDialog.Root open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Error</AlertDialog.Title>
          <AlertDialog.Description size="2">{error}</AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Action>
              <Button variant="solid" color="gray" onClick={() => setError(null)}>
                Close
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card>
  );
};

export default Feeds;
