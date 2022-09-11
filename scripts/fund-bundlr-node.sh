# $1  amount
# $2 Alchemy private key

yarn bundlr fund $1 -h https://devnet.bundlr.network -c ethereum -w eth-wallet.json --provider-url
 https://eth-goerli.g.alchemy.com/v2/$2