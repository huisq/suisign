// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex } from '@radix-ui/themes';
import { useNetworkVariable } from './networkConfig';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { getObjectExplorerLink } from './utils';

export interface Allowlist {
  id: string;
  name: string;
  list: string[];
}

interface AllowlistProps {
  setRecipientAllowlist: React.Dispatch<React.SetStateAction<string>>;
  setCapId: React.Dispatch<React.SetStateAction<string>>;
}

export function Allowlist({ setRecipientAllowlist, setCapId }: AllowlistProps) {
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [allowlist, setAllowlist] = useState<Allowlist>();
  const { id } = useParams();
  const [capId, setInnerCapId] = useState<string>();

  // NEW: signed status map: address -> bool
  const [signedBy, setSignedBy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function getAllowlistAndStatuses() {
      // ---- Load all caps owned by current account
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount?.address!,
        options: { showContent: true, showType: true },
        filter: { StructType: `${packageId}::allowlist::Cap` },
      });

      // Cap for this allowlist
      const capIdArr = res.data
        .map((obj) => {
          const fields = (obj!.data!.content as { fields: any }).fields;
          return { id: fields?.id.id as string, allowlist_id: fields?.allowlist_id as string };
        })
        .filter((item) => item.allowlist_id === id)
        .map((item) => item.id) as string[];

      setCapId(capIdArr[0]);
      setInnerCapId(capIdArr[0]);

      // ---- Load the allowlist object
      const wl = await suiClient.getObject({ id: id!, options: { showContent: true } });
      const fields = (wl.data?.content as { fields: any })?.fields || {};

      const list: string[] = fields.list ?? [];
      setAllowlist({ id: id!, name: fields.name, list });
      setRecipientAllowlist(id!);

      // ---- Load signed statuses from Table<address,bool>
      // Sui table object id is typically at: fields.signed.fields.id.id
      const signedTableId: string | undefined = fields?.signed?.fields?.id?.id;
      if (!signedTableId || !Array.isArray(list) || list.length === 0) {
        setSignedBy({});
        return;
      }

      // Query each address' DF entry; if not found => not signed
      const results = await Promise.all(
        list.map(async (addr) => {
          try {
            const entry = await suiClient.getDynamicFieldObject({
              parentId: signedTableId,
              name: { type: 'address', value: addr },
            });
            const rawVal = (entry as any)?.data?.content?.fields?.value;
            const value =
              typeof rawVal === 'boolean'
                ? rawVal
                : typeof rawVal?.fields?.value === 'boolean'
                  ? rawVal.fields.value
                  : false;
            return [addr, !!value] as const;
          } catch {
            return [addr, false] as const; // no entry => not signed
          }
        }),
      );

      setSignedBy(Object.fromEntries(results));
    }

    // initial + poll
    getAllowlistAndStatuses();
    const intervalId = setInterval(() => {
      getAllowlistAndStatuses();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [id, currentAccount?.address, packageId, suiClient]);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showRawEffects: true, showEffects: true },
      }),
  });

  const addItem = (newAddressToAdd: string, wl_id: string, cap_id: string) => {
    if (newAddressToAdd.trim() !== '') {
      if (!isValidSuiAddress(newAddressToAdd.trim())) {
        alert('Invalid address');
        return;
      }
      const tx = new Transaction();
      tx.moveCall({
        arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.address(newAddressToAdd.trim())],
        target: `${packageId}::allowlist::add`,
      });
      tx.setGasBudget(10_000_000);

      signAndExecute({ transaction: tx }, { onSuccess: (result) => console.log('res', result) });
    }
  };

  const removeItem = (addressToRemove: string, wl_id: string, cap_id: string) => {
    if (addressToRemove.trim() !== '') {
      const tx = new Transaction();
      tx.moveCall({
        arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.address(addressToRemove.trim())],
        target: `${packageId}::allowlist::remove`,
      });
      tx.setGasBudget(10_000_000);

      signAndExecute({ transaction: tx }, { onSuccess: (result) => console.log('res', result) });
    }
  };

  return (
    <Flex direction="column" gap="2" justify="start">
      <Card key={`${allowlist?.id}`}>
        <h2 style={{ marginBottom: '1rem' }}>
          Admin View: SuiSign {allowlist?.name} (ID{' '}
          {allowlist?.id && getObjectExplorerLink(allowlist.id)})
        </h2>
        <h3 style={{ marginBottom: '1rem' }}>
          Share&nbsp;
          <a
            href={`${window.location.origin}/suisign/view/doc/${allowlist?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            this link
          </a>{' '}
          with users to access the files associated with this SuiSign.
        </h3>

        <Flex direction="row" gap="2">
          <input placeholder="Add new address" />
          <Button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              addItem(input.value, id!, capId!);
              input.value = '';
            }}
          >
            Add
          </Button>
        </Flex>

        <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Allowed Users:</h4>
        {Array.isArray(allowlist?.list) && allowlist?.list.length > 0 ? (
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            {allowlist?.list.map((addr, idx) => {
              const signed = !!signedBy[addr];
              return (
                <li
                  key={idx}
                  style={{
                    listStyleType: 'disc',
                    color: '#cbd5e1',
                    marginBottom: '8px',
                  }}
                >
                  <Flex
                    direction="row"
                    align="center"
                    justify="between"
                    gap="3"
                    wrap="wrap"
                    style={{
                      padding: '2px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Flex direction="row" align="center" gap="3">
                      <p
                        style={{
                          margin: 0,
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: '#cbd5e1',
                          wordBreak: 'break-all',
                        }}
                      >
                        {addr}
                      </p>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          background: signed ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                          color: signed ? '#22c55e' : '#94a3b8',
                          fontWeight: 500,
                        }}
                      >
                        {signed ? 'Signed' : 'Not signed'}
                      </span>
                    </Flex>

                    <Button
                      disabled={signed}
                      title={signed ? 'User has signed; cannot remove' : 'Remove from allowlist'}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!signed) removeItem(addr, id!, capId!);
                      }}
                      style={{
                        minWidth: '32px',
                        height: '28px',
                        borderRadius: '8px',
                        marginRight: '4px',
                      }}
                    >
                      <X />
                    </Button>
                  </Flex>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No user in this SuiSign.</p>
        )}
      </Card>
    </Flex>
  );
}
