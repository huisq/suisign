// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Button, Card, Container, Flex, Grid } from '@radix-ui/themes';

import { CreateAllowlist } from './CreateAllowlist';
import { Allowlist } from './Allowlist';
import WalrusUpload from './EncryptAndUpload';
import { AllAllowlist } from './OwnedAllowlists';
import Feeds from './AllowlistView';
import SealLogo from './assets/sui_seal.svg';
import OtterLogo from './assets/otter_logo.png';
import OtterWhtLogo from './assets/otter_logo_white.png';
import ArtImg from './assets/art3mis.png';
import WalrusLogo from './assets/sui_walrus.svg';

import './styles/global.css'; // old dark background + hero-card styles
import './styles/landing.css'; // landing-only styles (all classes prefixed landing-)

/* ----------------------------------------------------
 * Shared header 
 * ---------------------------------------------------- */
function AppHeader() {
  return (
    <Container>
      <Flex position="sticky" py="2" justify="between" align="center">
                <div className="header-logo">
          <img src={OtterLogo} alt="SuiSign Logo" className="header-logo-img" />
          <Link to="/" style={{ textDecoration: "none" }}>
        <h1 className="h-bubbly" style={{ fontSize: 60, margin: 0 }}>
          SuiSign
        </h1>
        </Link>
        </div>
        <Box>
          <ConnectButton />
        </Box>
      </Flex>
    </Container>
  );
}

/* ----------------------------------------------------
 * Old landing card (still used on /suisign pages)
 * ---------------------------------------------------- */
function OldLandingCard() {
  return (
    <Grid columns="1" gap="4">
      <Card className="glass hero-card">
        {/* subtle dot grid overlay */}
        <div className="hero-dots" />

        <Flex direction="row" align="center" justify="between" wrap="wrap" gap="3">
          <div style={{ minWidth: 320 }}>
            <p className="grad-title" style={{ fontSize: 38, marginBottom: 8 }}>
              Sign legal documents — securely, privately, and on-chain.
            </p>
            <p className="lead">
              SuiSign lets you upload, encrypt, and sign any legal document using your Sui wallet.
              Your file is sealed with cryptographic encryption
              <span className="inline-logo">
                <img src={SealLogo} alt="Seal" />
              </span>
              , stored on decentralized storage
              <img src={WalrusLogo} className="inline-logo" alt="Walrus" />, and signed immutably on
              the Sui blockchain.
            </p>
          </div>
        </Flex>
      </Card>
    </Grid>
  );
}

/* ----------------------------------------------------
 * New marketing landing sections 
 * ---------------------------------------------------- */

function LandingHero() {
  return (
    <section className="landing-hero-container">
      <div className="landing-hero-left">
        <h1 className="landing-hero-title">
          Where Legal Documents Meet <br />
          Security &amp; Simplicity
        </h1>
        <p className="landing-hero-subtitle">
          Upload once, encrypt with
          <span className="keyword-gradient"> Seal</span>
          , store on 
          <span className="keyword-gradient"> Walrus</span>
          , and collect signatures from your Sui wallet — immutably on-chain.
        </p>

        <div className="landing-hero-buttons">
          <Link to="/suisign">
            <button className="landing-btn-primary-lg">Get Started →</button>
          </Link>

          <a href="#overview" className="btn-secondary-lg">
            Learn More <span className="chevron">⌄</span>
          </a>
        </div>
      </div>

      <div className="landing-hero-right">
        <div className="landing-floating-orb">
          <img src={OtterLogo} className="landing-floating-ship" alt="SuiSign Logo" />
        </div>
      </div>
    </section>
  );
}

function LandingSectionTitle(props: { title: string; subtitle: string }) {
  return (
    <div className="landing-section-header">
      <h2>{props.title}</h2>
      <div className="landing-section-underline" />
      <p>{props.subtitle}</p>
    </div>
  );
}

function LandingOverviewSection() {
  return (
    <section id="overview" className="landing-overview-section">
      <LandingSectionTitle
        title="Project Overview"
        subtitle="A secure and unified signing platform for on-chain legal approvals."
      />
      <div className="landing-overview-text">
        <p>
          In traditional legal workflows, document signing is slow, fragmented, and often insecure.
          Centralized storage of important confidential legal documents is risky as they may be
          accessed by certain centralized entity by circumstances. SuiSign solves this by providing
          a decentralized platform where documents are encrypted, stored on Walrus, and approved and
          signed through Sui wallets.
        </p>
        <p>
          Each approval is recorded immutably on the Sui blockchain — transparent, tamper-proof, and
          verifiable forever.
        </p>
      </div>
    </section>
  );
}

function LandingFeaturesSection() {
  const items = [
    {
      icon: '🔐',
      title: 'Encrypted Document Storage',
      desc: 'Files are encrypted with Seal before being uploaded.',
    },
    {
      icon: '🗄️',
      title: 'Walrus Storage',
      desc: 'Decentralized & permanent storage for legal documents.',
    },
    {
      icon: '🧑‍⚖️',
      title: 'On-chain Verification',
      desc: 'Every signature is immutably recorded on Sui.',
    },
    {
      icon: '🔗',
      title: 'Shareable Signing Links',
      desc: 'Invite signers with a link verified with Sui Wallet.',
    },
  ];

  return (
    <section id="features" className="landing-features-section">
      <LandingSectionTitle
        title="Key Features"
        subtitle="Everything you need for secure, on-chain signing."
      />
      <div className="landing-features-grid">
        {items.map((f) => (
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <span>{f.icon}</span>
            </div>
            <div className="landing-feature-text">
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <span>© 2025 SuiSign. All rights reserved.</span>
        <a>Contact us</a>
      </div>
    </footer>
  );
}

function LandingLayout() {
  return (
    <div className="page-shell" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* background layers */}
      <div id="app-stars" />
      <div id="app-bg" />
      <div className="bg-orbs" />

      <div className="page-content">
        <AppHeader />

        {/* landing content */}
        <main className="landing-main">
          <LandingHero />
          <LandingOverviewSection />
          <LandingFeaturesSection />
        <LandingDemoSection />   
        <LandingTeamSection />  
        </main>

        {/* bottom glows + landing footer */}
        <footer className="footer-glow" />
        <LandingFooter />
      </div>
    </div>
  );
}

function LandingDemoSection() {
  return (
    <section id="demo" className="landing-demo-section">
      <LandingSectionTitle
        title="Demo Video"
        subtitle="See how SuiSign works from upload to final signature."
      />

      <div className="landing-demo-wrapper">
        <div className="landing-video-frame">
          <iframe
            src="https://www.youtube.com/embed/sZdupSOgq44"
            title="SuiSign Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function LandingTeamSection() {
  return (
    <section id="team" className="landing-team-section">
      <LandingSectionTitle
        title="Team"
        subtitle="The brains behind SuiSign."
      />

      <div className="landing-team-wrapper">
        <div className="landing-team-card">
          <img
            src={ArtImg} 
            alt="Art3mis"
            className="landing-team-avatar"
          />

          <h3 className="landing-team-name">Art3mis</h3>
          <p className="landing-team-role">Founder & Fullstack Engineer</p>
          <p className="landing-team-bio">
            Art3mis designs, audits, and ships Move-based smart contracts across Sui
            Ecosystem, with a focus on secure DeFi and on-chain legal workflows.
            SuiSign combines that engineering background with product thinking to
            make document signing feel simple and trustworthy.
          </p>
        </div>
      </div>
    </section>
  );
}


/* ----------------------------------------------------
 * SuiSign dapp shell
 * ---------------------------------------------------- */

function SuiSignShell() {
  const currentAccount = useCurrentAccount();
  const [recipientAllowlist, setRecipientAllowlist] = useState<string>('');
  const [capId, setCapId] = useState<string>('');

  return (
    <div className="page-shell" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* backgrounds */}
      <div id="app-stars" />
      <div id="app-bg" />
      <div className="bg-orbs" />

      {/* NEW: flex wrapper */}
      <div className="page-content">
        <AppHeader />

        <Container className="suisign-page-content">
          <div className="suisign-block">
            <OldLandingCard />
          </div>

          {currentAccount ? (
            <Routes>
              <Route path="/" element={<CreateAllowlist />} />
              <Route
                path="admin/doc/:id"
                element={
                  <div>
                    <div className="suisign-block">
                      <Allowlist
                        setRecipientAllowlist={setRecipientAllowlist}
                        setCapId={setCapId}
                      />
                    </div>

                    <div className="suisign-block">
                      <WalrusUpload
                        policyObject={recipientAllowlist}
                        cap_id={capId}
                        moduleName="allowlist"
                      />
                    </div>
                  </div>
                }
              />

              <Route path="admin/all-suisigns" element={<AllAllowlist />} />
              <Route path="view/doc/:id" element={<Feeds suiAddress={currentAccount.address} />} />
            </Routes>
          ) : (
            <p>Please connect your wallet to continue</p>
          )}
        </Container>

        {/* shared footer glow + text footer */}
        <footer className="footer-glow" />
        <LandingFooter />
      </div>
    </div>
  );
}

/* ----------------------------------------------------
 * Top-level app router
 * ---------------------------------------------------- */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingLayout />} />
        <Route path="/suisign/*" element={<SuiSignShell />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
