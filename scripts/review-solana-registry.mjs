import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Pass the repository root');
const reviewedAt = new Date().toISOString();
const fetchText = async (url) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
};
function csv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(cell.replace(/\r$/, '')); cell = ''; if (c === '\n') { rows.push(row); row = []; } }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift();
  return rows.filter(r => r.length === header.length).map(r => Object.fromEntries(header.map((h,i) => [h,r[i]])));
}
const xUrl = 'https://xstocks.com/products';
const ondoDoc = 'https://docs.ondo.finance/addresses';
const [xh, oh] = await Promise.all([fetchText(xUrl), fetchText(ondoDoc)]);
const xp = JSON.parse(xh.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]).props.pageProps.products;
const csvUrl = oh.match(/href="(https:\/\/www\.dropbox\.com\/[^"<>]+\.csv\?[^"<>]+)"/)[1].replaceAll('&amp;','&').replace('dl=0','dl=1');
const op = csv(await fetchText(csvUrl));
const categories = {
  'metal-fund': ['GLD','SLV','PALL','PPLT'],
  'commodity-futures-fund': ['BNO','USO','UNG','CPER'],
  'energy-equity': ['XOM','CVX','COP','OXY','LNG','VLO'],
  'mining-equity': ['ALB','FCX','SCCO','NEM','RGLD','MP','USAR','UUUU','CCJ'],
  'resource-equity-fund': ['XOP','XLE','URA','NLR','GDX','COPX'],
  'equity-benchmark': ['AAPL','NVDA','MSTR','MRVL','LLY','NKE','SPCX'],
  'index-fund': ['SPY','QQQ'],
};
const classify = ticker => Object.entries(categories).find(([,symbols])=>symbols.includes(ticker))?.[0];
const labels = {
  'metal-fund':'Metal fund exposure', 'commodity-futures-fund':'Commodity futures fund',
  'energy-equity':'Energy company shares', 'mining-equity':'Mining company shares',
  'resource-equity-fund':'Resource equity fund', 'equity-benchmark':'Company shares', 'index-fund':'Equity index fund',
};
const exposureNote = c => c === 'commodity-futures-fund'
  ? 'Exposure through a futures-based fund; fund returns can diverge from spot commodity prices. No claim to physical delivery.'
  : c === 'metal-fund' ? 'Exposure through a listed metal fund. This token is not a directly redeemable claim to bullion.'
  : 'Exposure to a listed security, including company or fund risks. This token does not convey a direct claim to reserves, mineral output or project royalties.';
const xSelected = new Set(['GLDx','SLVx','PPLTx','PALLx','XOMx','CVXx','COPx','OXYx','LNGx','VLOx','XOPx','XLEx','ALBx','FCXx','SCCOx','NEMx','RGLDx','MPx','USARx','UUUUx','URAx','NLRx','GDXx','COPXx','AAPLx','NVDAx','SPYx','QQQx']);
const xAssets = xp.filter(p=>xSelected.has(p.symbol)).map(p=>{
  if (!p.addresses.solana) throw new Error(`No issuer Solana address for ${p.symbol}`);
  const underlyingTicker = p.symbol.slice(0,-1), category = classify(underlyingTicker);
  return {symbol:p.symbol,name:p.name,issuer:'Backed Assets (JE) Limited',provider:'xStocks',underlying:p.name.replace(/ xStock$/,''),underlyingTicker,category,exposure:labels[category],structure:'Tracker certificate',chains:['Solana'],status:'source-reviewed',solanaMint:p.addresses.solana,reviewedAt,sourceUrl:`https://assets.backed.fi/products/${p.slug}`,addressSourceUrl:xUrl,relevance:exposureNote(category)};
});
if(xAssets.length !== xSelected.size) throw new Error('Selected xStock missing from official catalog');
const oSelected = new Set(['CPERon','BNOon','USOon','UNGon','GLDon','SLVon','PALLon','PPLTon','CCJon','XOMon','CVXon','MPon','FCXon','NEMon']);
const oAssets = op.filter(p=>oSelected.has(p.Symbol) && p['Solana Deployed Address']).map(p=>{
  const underlyingTicker=p['Stock Ticker'],category=classify(underlyingTicker);
  if(!category) throw new Error(`Unclassified ${p.Symbol}`);
  return {symbol:p.Symbol,name:p.Name,issuer:'Ondo Global Markets',provider:'Ondo',underlying:p['Stock Name'],underlyingTicker,category,exposure:labels[category],structure:'Tokenized security exposure',chains:['Solana'],status:'source-reviewed',solanaMint:p['Solana Deployed Address'],reviewedAt,sourceUrl:`https://app.ondo.finance/assets/${p.Symbol.toLowerCase()}`,addressSourceUrl:ondoDoc,relevance:exposureNote(category)};
});
const backpack = [
 ['COPX','Global X Copper Miners ETF','tokenized-global-x-copper-miners-etf-copx'],
 ['USO','United States Oil Fund','tokenized-united-states-oil-fund-uso'],
 ['MSTR','Strategy Inc.','tokenized-strategy-mstr'],['MRVL','Marvell Technology, Inc.','tokenized-marvell-technology-mrvl'],
 ['LLY','Eli Lilly and Company','tokenized-eli-lilly-lly'],['NKE','NIKE, Inc.','tokenized-nike-nke'],
];
const bAssets = await Promise.all(backpack.map(async ([symbol,underlying,slug])=>{
  const sourceUrl=`https://learn.backpack.exchange/blog/${slug}`,html=await fetchText(sourceUrl);
  const plain=html.replace(/<[^>]*>/g,' ');
  const mint=plain.match(/Token address\s*([1-9A-HJ-NP-Za-km-z]{32,44})/)?.[1];
  if(!mint) throw new Error(`No issuer mint parsed for Backpack ${symbol}`);
  const category=classify(symbol) ?? 'equity-benchmark';
  return {symbol,name:`${underlying} · Backpack Securities`,issuer:'Backpack Securities',provider:'Backpack',underlying,underlyingTicker:symbol,category,exposure:labels[category],structure:'Tokenized claim; issuer redemption into securities',chains:['Solana'],status:'source-reviewed',solanaMint:mint,reviewedAt,sourceUrl,addressSourceUrl:sourceUrl,relevance:'Issuer documents conversion into the underlying security through Backpack Securities. Eligibility and issuer terms apply. An exchange stock or perpetual listing alone is not evidence of a withdrawable Solana token.'};
}));
// Robinhood Chain (EVM, chain id 4663). Issuer-published registry via the public
// read-only asset API; each contract is then checked on the public mainnet RPC.
const rhApi='https://api.robinhood.com/rhj/assets', rhDocs='https://docs.robinhood.com/chain/contracts', rhRpc='https://rpc.mainnet.chain.robinhood.com', rhChainId=4663;
const rhSelected=['XOM','USO','GLD','SLV','USAR','CEG','VST','OKLO','SMR','NNE','GEV'];
const rhCategories={XOM:'energy-equity',USO:'commodity-futures-fund',GLD:'metal-fund',SLV:'metal-fund',USAR:'mining-equity',CEG:'energy-equity',VST:'energy-equity',OKLO:'energy-equity',SMR:'energy-equity',NNE:'energy-equity',GEV:'energy-equity'};
const rhResources={CEG:'Nuclear and power generation',VST:'Power generation',OKLO:'Advanced nuclear',SMR:'Small modular reactors',NNE:'Microreactors and nuclear fuel',GEV:'Power generation equipment'};
const rhRegistry=(await fetch(rhApi,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(25000)}).then(r=>r.json())).assets;
const evm=async(method,params)=>{const r=await fetch(rhRpc,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(25000)}).then(r=>r.json()); if(r.error||r.result===undefined) throw new Error(`${method}: ${JSON.stringify(r.error)}`); return r.result;};
const evmString=hex=>{const h=hex.slice(2); if(h.length<128) return Buffer.from(h,'hex').toString('utf8').replace(/\0+$/,''); const off=parseInt(h.slice(0,64),16)*2, len=parseInt(h.slice(off,off+64),16)*2; return Buffer.from(h.slice(off+64,off+64+len),'hex').toString('utf8');};
if(parseInt(await evm('eth_chainId',[]),16)!==rhChainId) throw new Error('Unexpected Robinhood Chain id');
const rhBlock=parseInt(await evm('eth_blockNumber',[]),16);
const rhAssets=await Promise.all(rhSelected.map(async ticker=>{
  const p=rhRegistry.find(a=>a.tokenSymbol===ticker); if(!p) throw new Error(`Not in Robinhood registry: ${ticker}`);
  const dep=p.deployments.find(d=>d.chainId===rhChainId); if(!dep) throw new Error(`No Robinhood Chain deployment: ${ticker}`);
  const address=dep.contractAddress, call=sel=>evm('eth_call',[{to:address,data:sel},'latest']);
  const code=await evm('eth_getCode',[address,'latest']); if(code.length<=4) throw new Error(`No contract code: ${ticker}`);
  const symbol=evmString(await call('0x95d89b41')), decimals=parseInt(await call('0x313ce567'),16), supplyRaw=BigInt(await call('0x18160ddd')).toString();
  if(symbol!==ticker) throw new Error(`Contract symbol mismatch for ${ticker}: ${symbol}`);
  const category=rhCategories[ticker], underlying=p.tokenName.replace(/\s*\S\s*Robinhood Token$/,'').trim();
  return {symbol:ticker,name:`${underlying} · Robinhood Token`,issuer:'Robinhood Assets (Jersey) Limited',provider:'Robinhood',underlying,underlyingTicker:ticker,category,exposure:labels[category],structure:'ERC-20 stock token; corporate actions applied through an on-chain multiplier (ERC-8056)',chains:['Robinhood Chain'],status:'source-reviewed',evmAddress:address,chainId:rhChainId,reviewedAt,sourceUrl:'https://docs.robinhood.com/rhj',addressSourceUrl:rhDocs,relevance:exposureNote(category)+' Issuer documents state the tokens are not offered to U.S. persons and are restricted in further jurisdictions.',
    onchain:{checkedAt:new Date().toISOString(),block:rhBlock,chainId:rhChainId,decimals,supplyRaw,codePresent:true,multiplier:p.currentMultiplier,registryStatus:p.status,rpcUrl:rhRpc}};
}));
const assets=[...xAssets,...oAssets,...bAssets,...rhAssets];
if(new Set(assets.map(a=>a.solanaMint ?? a.evmAddress.toLowerCase())).size!==assets.length) throw new Error('Duplicate mint or contract');
const resources={GLD:'Gold',SLV:'Silver',PALL:'Palladium',PPLT:'Platinum',BNO:'Brent crude oil',USO:'WTI crude oil',UNG:'Natural gas',CPER:'Copper',XOM:'Oil and gas',CVX:'Oil and gas',COP:'Oil and gas',OXY:'Oil and gas',LNG:'Liquefied natural gas',VLO:'Oil refining',ALB:'Lithium',FCX:'Copper and gold',SCCO:'Copper',NEM:'Gold',RGLD:'Gold royalties company',MP:'Rare earths',USAR:'Rare earths',UUUU:'Uranium and rare earths',CCJ:'Uranium',XOP:'Oil and gas equities',XLE:'Energy equities',URA:'Uranium equities',NLR:'Uranium and nuclear equities',GDX:'Gold mining equities',COPX:'Copper mining equities'};
const underlyingNames={GLD:'SPDR Gold Shares',SLV:'iShares Silver Trust',PALL:'abrdn Physical Palladium Shares ETF',PPLT:'abrdn Physical Platinum Shares ETF',SPY:'SPDR S&P 500 ETF Trust',QQQ:'Invesco QQQ Trust'};
const rpcUrl='https://api.mainnet-beta.solana.com';
const rpc=await fetch(rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getMultipleAccounts',params:[assets.filter(a=>a.solanaMint).map(a=>a.solanaMint),{encoding:'jsonParsed',commitment:'confirmed'}]}),signal:AbortSignal.timeout(25000)}).then(r=>r.json());
if(rpc.error || !rpc.result) throw new Error('Mainnet account verification failed');
assets.filter(a=>a.solanaMint).forEach((a,i)=>{
  const account=rpc.result.value[i], info=account?.data?.parsed?.info;
  if(account?.data?.parsed?.type!=='mint' || !info?.isInitialized) throw new Error(`Not an initialized mint: ${a.symbol}`);
  a.onchain={checkedAt:new Date().toISOString(),slot:rpc.result.context.slot,program:account.owner,decimals:info.decimals,supplyRaw:info.supply,initialized:true,rpcUrl};
});
assets.forEach(a=>{
  a.resource=resources[a.underlyingTicker] || rhResources[a.underlyingTicker] || 'Equity market benchmark';
  a.underlying=underlyingNames[a.underlyingTicker] || a.underlying;
});
const data={meta:{id:'registry',version:reviewedAt.slice(0,10),reviewedAt,title:'Tokenized resources and securities on Solana and Robinhood Chain',note:'Curated resource exposure plus selected equity benchmarks, not an exhaustive asset list. Source review confirms published product and mint or contract information; it is not a custody audit or liquidity guarantee.',chains:{Solana:{explorer:'https://solscan.io/token/'},'Robinhood Chain':{chainId:rhChainId,explorer:'https://robinhoodchain.blockscout.com/token/'}},sources:[xUrl,ondoDoc,'https://learn.backpack.exchange/','https://www.geckoterminal.com/category/tokenized-stocks/solana',rhApi,rhDocs]},assets};
// Signed dataset: any change here needs a CI anchor (gh workflow run eia-ingest.yml -f force_anchor=true).
writeFileSync(join(root,'src/data/registry.json'),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({reviewedAt,counts:{xStocks:xAssets.length,Ondo:oAssets.length,Backpack:bAssets.length,Robinhood:rhAssets.length},ondoNotInSolanaList:[...oSelected].filter(s=>!oAssets.some(a=>a.symbol===s)),assets:assets.map(a=>({symbol:a.symbol,address:a.solanaMint ?? a.evmAddress,chain:a.chains[0],category:a.category}))},null,2));
