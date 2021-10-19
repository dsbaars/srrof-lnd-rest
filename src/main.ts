import express from 'express';
import * as fs from 'fs';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader'
import cors from 'cors';

process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'

const loaderOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  };

const packageDefinition = protoLoader.loadSync('./src/lightning.proto', loaderOptions);

let m = fs.readFileSync('./credentials/readonly.macaroon');
let macaroon = m.toString('hex');

// build meta data credentials
let metadata = new grpc.Metadata()
metadata.add('macaroon', macaroon)
let macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
  callback(null, metadata);
});

// build ssl credentials using the cert the same as before
let lndCert = fs.readFileSync("./credentials/tls.cert");
let sslCreds = grpc.credentials.createSsl(lndCert);

// combine the cert credentials and the macaroon auth credentials
// such that every call is properly encrypted and authenticated
let credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
let lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
let lnrpc = lnrpcDescriptor.lnrpc;
// @ts-ignore
let client = new lnrpc.Lightning('localhost:10009', credentials);


// rest of the code remains same
const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.get('/node/:pubkey', async (req, res) => {

    let p = new Promise((resolve, reject) => {
        client.getNodeInfo({ 
            pub_key: req.params.pubkey,
            include_channels: true
          }, (err:any, response:any) => {
            if (err) {
              console.log('Error: ' + err);
            }
            resolve(response);
            return response;
          });
    });

    
    let data = await p;
    res.json(data);
});


app.get('/', (req, res) => res.send('Quick & Dirty LND server'));
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});