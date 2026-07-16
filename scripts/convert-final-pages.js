#!/usr/bin/env node
/**
 * Convert books/wallets/meetups Vue pages to Hugo markdown.
 */
const fs = require('fs');
const path = require('path');

const UPSTREAM = '/home/henrrius/repos/btc/bitcoin-only-upstream/pages';
const OUT = '/home/henrrius/repos/btc/bitcoin-only-hugo/content';

function extractData(vuePath) {
  const src = fs.readFileSync(vuePath, 'utf8');
  const scriptMatch = src.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) throw new Error('no script in ' + vuePath);
  const script = scriptMatch[1];
  const dataMatch = script.match(/data\(\)\s*\{\s*return\s*(\{[\s\S]*\})\s*;?\s*\}\s*,?\s*\n?\s*\}\s*\n?\s*<\/script>/)
    || script.match(/data\(\)\s*\{\s*return\s*(\{[\s\S]*\})\s*;?\s*\}\s*\n?\s*\}\s*$/);
  // Simpler: find "data() {" then "return {" and match braces
  const dataIdx = script.indexOf('data()');
  const returnIdx = script.indexOf('return', dataIdx);
  const braceStart = script.indexOf('{', returnIdx);
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < script.length; i++) {
    if (script[i] === '{') depth++;
    else if (script[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const objSrc = script.slice(braceStart, end + 1);
  // eslint-disable-next-line no-new-func
  return Function('"use strict"; return (' + objSrc + ')')();
}

function escPipe(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function linkHtml(text, href) {
  if (!href) return escPipe(text);
  return `<a href="${href}" target="_blank">${escPipe(text)}</a>`;
}

function authorsHtml(authors) {
  return (authors || []).map(a => linkHtml(a.name, a.link)).join(', ');
}

function purchaseHtml(links) {
  return (links || []).map(l => linkHtml(l.title, l.link)).join(' , ');
}

function feature(v) {
  return v
    ? '<span class="feature-yes" aria-label="yes">●</span>'
    : '<span class="feature-no" aria-label="no">○</span>';
}

function table(headers, rows) {
  return [
    `{{< table headers="${headers}" >}}`,
    ...rows,
    '{{< /table >}}',
  ].join('\n');
}

function writeBooks() {
  const data = extractData(path.join(UPSTREAM, 'books.vue'));
  const rows = data.books.map(b =>
    // title is NOT linked in Vue
    `${escPipe(b.title)}||${escPipe(b.synopsis)}|${authorsHtml(b.authors)}|${purchaseHtml(b.purchaseLinks)}`
  );
  const md = `---
title: "Books - Bitcoin Only"
description: "A collection of books about Bitcoin."
---

<div id="books-page">

<h1 class="page-title">Books</h1>

{{< getting-started >}}
<ul>
<li>For a non-technical intro read 'The Bitcoin Standard' by Saifedean Ammous (<a href="https://www.amazon.com/Bitcoin-Standard-Decentralized-Alternative-Central/dp/1119473861" target="_blank">Amazon</a>)</li>
<li>For a technical intro read 'Grokking Bitcoin' by Kalle Rosenbaum (<a href="https://www.manning.com/books/grokking-bitcoin" target="_blank">Manning Books</a> | <a href="https://github.com/kallerosenbaum/grokkingbitcoin" target="_blank">GitHub</a>)</li>
<li>For further technical info read 'Programming Bitcoin' by Jimmy Song (<a href="https://www.amazon.com/Programming-Bitcoin-Learn-Program-Scratch/dp/1492031496" target="_blank">Amazon</a> | <a href="https://github.com/jimmysong/programmingbitcoin" target="_blank">GitHub</a>)</li>
</ul>
{{< /getting-started >}}

${table('Title,Synopsis,Author,Purchase Links', rows)}

</div>
`;
  fs.writeFileSync(path.join(OUT, 'books.md'), md);
  return { books: rows.length };
}

function writeWallets() {
  const data = extractData(path.join(UPSTREAM, 'wallets.vue'));
  const featKeys = ['desktop','ios','android','coincontrol','coinjoin','onchain','lightning','multisig','tor','bip47'];
  const recRows = data.recommendedWallets.map(w =>
    [escPipe(w.title), w.link, ...featKeys.map(k => feature(w[k]))].join('|')
  );
  const platformRows = (arr) => arr.map(w =>
    `${escPipe(w.title)}|${w.link}|${escPipe(w.description)}|${escPipe(w.platform)}`
  );
  const advRows = data.advancedStorageMethods.map(w =>
    `${escPipe(w.title)}|${w.link}|${(w.devs||[]).map(d => linkHtml(d.name, d.link)).join(', ')}|${escPipe(w.description)}`
  );
  const depRows = data.depreciatedWallets.map(w =>
    `${escPipe(w.title)}|${w.link}|${escPipe(w.description)}|${escPipe(w.platform)}`
  );

  const md = `---
title: "Wallets - Bitcoin Only"
description: "A collection Bitcoin only wallets."
---

<div id="wallets-page">

<h1 class="page-title">Wallets</h1>

{{< getting-started >}}
<ul>
<li>Desktop: <a href="https://www.sparrowwallet.com/" target="_blank">Sparrow Wallet</a> connected to <a href="https://bitcoincore.org/" target="_blank">Bitcoin Core</a></li>
<li>Android: <a href="https://samouraiwallet.com/" target="_blank">Samourai Wallet</a></li>
<li>Lightning: <a href="https://muun.com/" target="_blank">Muun Wallet</a></li>
</ul>
{{< /getting-started >}}

<p>It is very important that you learn how to back up your mnemonic seed and that if you use a passphrase, you back that up too. Read <a href="https://bitcoin-intro.com/en/backup" target="_blank">this document</a> to learn more about backing up your wallet and check out the <a href="/privacy">privacy page</a>.</p>
<p>See <a href="https://veriphi.io/en/blog/software-wallet-analysis" target="_blank">this report</a> for a comparison of the features of many of the wallets listed below.</p>

<h3>Recommended Wallets</h3>

${table('Project,Desktop,iOS,Android,CoinControl,CoinJoin,OnChain,Lightning,Multisig,Tor,BIP47', recRows)}

<h3>On-Chain Wallets</h3>

${table('Project,Description,Platform', platformRows(data.onChainWallets))}

<h3>Lightning Wallets</h3>

${table('Project,Description,Platform', platformRows(data.lightningWallets))}

<h3>Closed Sourced Wallets</h3>

${table('Project,Description,Platform', platformRows(data.closedSourceWallets))}

<h3>Custodial Accounts</h3>

${table('Project,Description,Platform', platformRows(data.custodialAccounts))}

<h3>Advanced Storage Methods</h3>

${table('Project,Dev,Description', advRows)}

<div class="footnotes">
<p><sup>[0]</sup>Google Drive backups allow companies to access your email address, name, and Google profile picture. It's strongly recommended to use a separate Google account to use these apps.</p>
<p><sup>[1]</sup>Blue Wallet's Lightning is custodial by default, but users can opt to connect their app to their own Lightning node using LNDhub. The on-chain functionality is non-custodial.</p>
<p><sup>[2]</sup>Bottle.li is fully custodial, meaning you do not have your private keys, thus you are not guaranteed full control of your funds.</p>
<p><sup>[3]</sup>Opennode is fully custodial, meaning you do not have your private keys, thus you are not guaranteed full control of your funds. You can (and should) set reoccurring withdrawals to send any bitcoin you receive to your own wallet.</p>
<p><sup>[4]</sup>Tippin.me is fully custodial, meaning you do not have your private keys, thus you are not guaranteed full control of your funds.</p>
<p><sup>[5]</sup>Wallet of Satoshi is fully custodial, meaning you do not have your private keys, thus you are not guaranteed full control of your funds.</p>
<p><sup>[6]</sup>Since the wallet is closed source, we recommend using 3/5 and only with hardware devices that you source independently.</p>
<p><sup>[7]</sup>These wallets integrate a KYC exchange to buy bitcoin. We recommend against using KYC exchanges due to the <a href="https://bitcoinqna.github.io/noKYConly1/" target="_blank">risks</a>.</p>
<p><sup>[8]</sup>Alby's users can opt to connect their browser extension to their Lightning node using LND, LNDhub, LNbits or Eclair. Also they can use Alby's custodial Lightning.</p>
</div>

<h3>Depreciated Wallets</h3>

${table('Project,Description,Platform', depRows)}

</div>
`;
  fs.writeFileSync(path.join(OUT, 'wallets.md'), md);
  return {
    recommended: recRows.length,
    onChain: data.onChainWallets.length,
    lightning: data.lightningWallets.length,
    closed: data.closedSourceWallets.length,
    custodial: data.custodialAccounts.length,
    advanced: advRows.length,
    depreciated: depRows.length,
  };
}

function writeMeetups() {
  const data = extractData(path.join(UPSTREAM, 'meetups.vue'));
  const cyberRows = data.cyberspace.map(m =>
    `${escPipe(m.title)}|${m.link}|${escPipe(m.description)}`
  );
  const meatRows = data.meatspace.map(m => {
    const region = m.region != null ? escPipe(m.region) : '';
    const city = linkHtml(m.city, m.link);
    const org = linkHtml(m.organizer, m.organizerLink);
    // country plain (no link): title|emptyURL|region|cityHtml|orgHtml
    return `${escPipe(m.country)}||${region}|${city}|${org}`;
  });

  const md = `---
title: "Meetups - Bitcoin Only"
description: "A collection of Bitcoin only meetups."
---

<div id="meetups-page">

<h1 class="page-title">Meetups</h1>

{{< getting-started >}}
<p> It is impossible to verify the authenticity of all meetups, please: </p>
<ul>
<li>Go with a friend for security</li>
<li>Do your own research before attending</li>
<li>Do not reveal personal information</li>
<li>Do not tell anyone how much bitcoin you own</li>
<li>Do <a href="https://github.com/bitcoin-only/bitcoin-only/issues/new?assignees=&labels=update&template=update-suggestion.md&title=Update+Suggestion%3A+NAME+OF+CONTENT+TO+BE+UPDATED" target="_blank">raise an issue</a> if you have a bad experience</li>
</ul>
<p> To get your meetup added <a href="https://github.com/bitcoin-only/bitcoin-only/issues/new?assignees=&labels=meetup&template=meetup-suggestion.md&title=Meetup+Suggestion%3A+%2A%2AExample+Bitcoin+Meetup%2A%2A" target="_blank">raise an issue</a>.</p>
{{< /getting-started >}}

<h3>Cyberspace</h3>

${table('Meetup,Description', cyberRows)}

<div class="footnote">* Weekly, accessible without a VR headset</div>

<h3>Meatspace</h3>

${table('Country,Region,City,Organizer', meatRows)}

</div>
`;
  fs.writeFileSync(path.join(OUT, 'meetups.md'), md);
  return { cyberspace: cyberRows.length, meatspace: meatRows.length };
}

const books = writeBooks();
const wallets = writeWallets();
const meetups = writeMeetups();
console.log(JSON.stringify({ books, wallets, meetups }, null, 2));
