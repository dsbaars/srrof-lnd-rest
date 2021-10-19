# Quick & Dirty LND REST API

A very, very quick & dirty way to expose LND to the SR RoF Webtools through an REST API.

## Usage

1. Run `yarn install` to install dependencies
2. Put `tls.cert` and macaroons in `credentials/` folder
3. Run `ts-node src/main`

You might also need to tunnel forward port 10009 through SSH: `ssh umbrel@umbrel -L 10009:localhost:10009`