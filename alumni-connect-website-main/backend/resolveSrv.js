const dns = require('dns');
const { Resolver } = dns.promises;

async function getStandardString() {
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']); // Force Google/Cloudflare DNS
  try {
    const srvRecords = await resolver.resolveSrv('_mongodb._tcp.srimancluster.dnk1mow.mongodb.net');
    console.log("SRV Records found:");
    console.log(srvRecords);

    // Construct the standard connection string
    const hosts = srvRecords.map(record => `${record.name}:${record.port}`).join(',');
    console.log("\nStandard Connection String:");
    console.log(`mongodb://srimankumar06_db_user:Annavel2006@${hosts}/alumnex-connect?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority`);

  } catch (error) {
    console.error("DNS Resolution Failed:", error);
  }
}

getStandardString();
