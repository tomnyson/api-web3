/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const fetch = require('node-fetch');
const HapiSwagger = require('../');
var Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/1c37394c71d748369948038cfbc3e794'));
const { convertBalanceToWei, convertWeiToBalance, config } = require('./globalFucntion');
console.log('config', config);
var MyContract = new web3.eth.Contract(config.abi, config.constractAddress);
let swaggerOptions = {
  info: {
    title: 'Test API Documentation',
    description: 'This is a sample example of API documentation.'
  }
};

const ser = async () => {
  const server = Hapi.Server({
    host: 'localhost',
    port: 3000,
    routes: { cors: true }
  });

  await server.register([
    Inert,
    Vision,
    Blipp,
    {
      plugin: HapiSwagger,
      options: swaggerOptions
    }
  ]);

  server.route([
    {
      method: 'GET',
      path: '/v1/web3/gas-price',
      options: {
        handler: async (request, h) => {
          const response = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
          let data = await response.json();
          console.log('data', data);
          return h.response(data);
        },
        description: 'Update sum',
        notes: ['Update a sum in our data store'],
        plugins: {
          'hapi-swagger': {
            payloadType: 'form'
          }
        },
        tags: ['api']
      }
    },
    {
      method: 'GET',
      path: '/v1/web3/convert',
      options: {
        handler: async (request, h) => {
          const value = request.query.value || 0;
          const type = request.query.type || 'eth';
          if (type === 'eth') {
            const balance = convertBalanceToWei(value);
            return h.response(balance);
          }
          const balance = convertWeiToBalance(value);
          return h.response(balance);
        },
        description: 'convert wei or ether',
        notes: ['Update a sum in our data store'],
        plugins: {
          'hapi-swagger': {
            payloadType: 'form'
          }
        },
        validate: {
          query: Joi.object({
            value: Joi.number(),
            type: Joi.string().valid('wei', 'eth')
          })
        },
        tags: ['api']
      }
    },
    {
      method: 'GET',
      path: '/v1/web3/txtdata',
      options: {
        handler: async (request, h) => {
          /**
           * create data transaction
           */
          try {
            let data = MyContract.methods.ClamFree().encodeABI();
            let getData = MyContract.methods
              .transfer('0xE3D43CB9B95Bd96959D3A926a60c20Edde3222cc', convertBalanceToWei(0.2))
              .encodeABI();
            const nonce = await web3.eth.getTransactionCount('0xE3D43CB9B95Bd96959D3A926a60c20Edde3222cc');
            console.log('number', nonce);
            const gasPrice = await web3.eth.getGasPrice();
            const gasPriceHex = web3.utils.toHex(Math.round(gasPrice * 10.4));
            console.log('gasPriceHex', gasPriceHex);
            const gasLimitHex = web3.utils.toHex(7300000);
            const value = web3.utils.toHex(convertBalanceToWei(0.02));
            console.log('gasLimitHex', gasLimitHex);
            console.log('nonece', '0x' + nonce.toString(16));
            console.log('value', value);
          } catch (error) {
            console.log(error);
            return h.response('hahahh');
            // throw error;
          }
        },
        description: 'get txt data transaction',
        notes: ['get txt data transaction'],
        plugins: {
          'hapi-swagger': {
            payloadType: 'form'
          }
        },
        validate: {
          query: Joi.object({
            func: Joi.string(),
            value: Joi.string()
          })
        },
        tags: ['api']
      }
    }
  ]);

  await server.start();
  return server;
};

ser()
  .then(server => {
    console.log(`Server listening on ${server.info.uri}`);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
