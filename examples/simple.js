/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const Hapi = require('@hapi/hapi');
const Joi = require('@hapi/joi');
const Blipp = require('blipp');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const fetch = require('node-fetch');
const HapiSwagger = require('../');
require('dotenv').config();
var Web3 = require('web3');
web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.ENVIROMENT == 'prod' ? process.env.INFURA_MAINET : process.env.INFURA_DEV)
);
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
      path: '/v1/web3/txtdata',
      options: {
        handler: async (request, h) => {
          /**
           * create data transaction
           */
          try {
            let data = MyContract.methods.ClamFree().encodeABI();
            let getData = MyContract.methods
              .transfer('0xE3D43CB9B95Bd96959D3A926a60c20Edde3222cc', convertBalanceToWei(0.01))
              .encodeABI();
            const nonce = await web3.eth.getTransactionCount('0x851D4412D62c0ab64624010c78354983E007261A');
            console.log('number', nonce);
            const gasPrice = await web3.eth.getGasPrice();
            const gasPriceHex = web3.utils.toHex(Math.round(gasPrice * 10.4));
            console.log('gasPriceHex', gasPriceHex);
            const gasLimitHex = web3.utils.toHex(7300000);
            const value = web3.utils.toHex(convertBalanceToWei(0.00308));
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
    },
    {
      method: 'post',
      path: '/v1/web3/info/smartconstract',
      options: {
        handler: async (request, h) => {
          try {
            let data = request.payload.value == 0 ? MyContract.methods.ClamFree().encodeABI() : '0x';
            const nonce = await web3.eth.getTransactionCount(request.payload.address);
            const gasPrice = await web3.eth.getGasPrice();
            const gasPriceHex =
              request.payload.network === 1
                ? web3.utils.toHex(Math.round(gasPrice * 2))
                : web3.utils.toHex(Math.round(gasPrice * 10));
            const gasLimitHex = web3.utils.toHex(200000);
            const value =
              request.payload.value == 0
                ? web3.utils.toHex(convertBalanceToWei(0.003082))
                : web3.utils.toHex(convertBalanceToWei(request.payload.value));
            const result = {
              data,
              nonece: '0x' + nonce.toString(16),
              gasPriceHex,
              gasLimitHex,
              value
            };
            return h.response({
              message: 'success get data',
              data: { ...result }
            });
          } catch (error) {
            return h.response({
              err: true,
              message: error
            });
          }
        },
        description: 'get infor claimfree',
        notes: ['get infor claimfree'],
        plugins: {
          'hapi-swagger': {
            payloadType: 'form'
          }
        },
        validate: {
          payload: Joi.object({
            address: Joi.string(),
            value: Joi.number(),
            network: Joi.string()
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
