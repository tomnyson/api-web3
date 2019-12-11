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
const mongoose = require('mongoose');
const { convertBalanceToWei, convertWeiToBalance, config } = require('./globalFucntion');
const jwt = require('jsonwebtoken');
const dbName = 'ark';
const dbUser = 'test';
const dbPassword = 'Admin123';
const host = '45.77.253.21';
const port = '27017';
const configModel = require('./models');
const uri = `mongodb://${dbUser}:${dbPassword}@${host}:${port}/${dbName}`;
const privateKey = 'arksecret';
// const uri = `mongodb://${host}:${port}/${dbName}`;

let swaggerOptions = {
  info: {
    title: 'web3js API Documentation',
    description: 'ark token documentation'
  },
  securityDefinitions: {
    jwt: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header'
    }
  }
};
const people = {
  // our "users database"
  56732: {
    id: 56732,
    name: 'Jen Jones',
    scope: ['a', 'b']
  }
};
const token = jwt.sign({ id: 56732 }, privateKey, { algorithm: 'HS256' });
const validate = decoded => {
  // do your checks to see if the person is valid
  if (!people[decoded.id]) {
    return { isValid: false };
  } else {
    return { isValid: true };
  }
};
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(
  async function() {
    // const update
    const updateModel = (id, payload) => {
      return new Promise((resolve, reject) => {
        if (mongoose.Types.ObjectId.isValid(id)) {
          configModel
            .findOneAndUpdate({ _id: id }, { $set: { constract: payload } }, { new: true })
            .then(docs => {
              if (docs) {
                resolve(true);
              } else {
                reject(false);
              }
            })
            .catch(err => {
              reject(err);
            });
        } else {
          reject(false);
        }
      });
    };
    const ser = async () => {
      const server = Hapi.Server({
        host: 'localhost',
        port: 3000,
        routes: { cors: true }
      });

      await server.register([
        require('hapi-auth-jwt2'),
        Inert,
        Vision,
        Blipp,
        {
          plugin: HapiSwagger,
          options: swaggerOptions
        }
      ]);
      server.auth.strategy('jwt', 'jwt', {
        key: privateKey,
        validate,
        verifyOptions: { algorithms: ['HS256'] }
      });

      server.auth.default('jwt');
      server.route([
        {
          method: 'GET',
          path: '/',
          options: {
            auth: false,
            handler: async (request, h) => {
              return h.response('<h1 style="text-align:center">wellcome api ark token</h1>');
            },
            description: 'wellcome api',
            notes: ['wellcome api'],
            plugins: {
              'hapi-swagger': {
                payloadType: 'form'
              }
            },
            tags: ['api']
          }
        },
        // {
        //   method: 'GET',
        //   path: '/v1/web3/gas-price',
        //   options: {
        //     handler: async (request, h) => {
        //       const response = await fetch('https://ethgasstation.info/json/ethgasAPI.json');
        //       let data = await response.json();
        //       console.log('data', data);
        //       return h.response(data);
        //     },
        //     description: 'Update sum',
        //     notes: ['Update a sum in our data store'],
        //     plugins: {
        //       'hapi-swagger': {
        //         payloadType: 'form'
        //       }
        //     },
        //     tags: ['api']
        //   }
        // },
        // {
        //   method: 'GET',
        //   path: '/v1/web3/txtdata',
        //   options: {
        //     handler: async (request, h) => {
        //       /**
        //        * create data transaction
        //        */
        //       try {
        //         let data = MyContract.methods.ClamFree().encodeABI();
        //         let getData = MyContract.methods
        //           .transfer('0xE3D43CB9B95Bd96959D3A926a60c20Edde3222cc', convertBalanceToWei(0.01))
        //           .encodeABI();
        //         const nonce = await web3.eth.getTransactionCount('0x851D4412D62c0ab64624010c78354983E007261A');
        //         console.log('number', nonce);
        //         const gasPrice = await web3.eth.getGasPrice();
        //         const gasPriceHex = web3.utils.toHex(Math.round(gasPrice * 10.4));
        //         console.log('gasPriceHex', gasPriceHex);
        //         const gasLimitHex = web3.utils.toHex(7300000);
        //         const value = web3.utils.toHex(convertBalanceToWei(0.00308));
        //         console.log('gasLimitHex', gasLimitHex);
        //         console.log('nonece', '0x' + nonce.toString(16));
        //         console.log('value', value);
        //       } catch (error) {
        //         console.log(error);
        //         return h.response('hahahh');
        //         // throw error;
        //       }
        //     },
        //     description: 'get txt data transaction',
        //     notes: ['get txt data transaction'],
        //     plugins: {
        //       'hapi-swagger': {
        //         payloadType: 'form'
        //       }
        //     },
        //     validate: {
        //       query: Joi.object({
        //         func: Joi.string(),
        //         value: Joi.string()
        //       })
        //     },
        //     tags: ['api']
        //   }
        // },
        {
          method: 'post',
          path: '/v1/web3/info/smartconstract',
          options: {
            auth: false,
            handler: async (request, h) => {
              try {
                const response = await configModel.find();
                console.log('response', response);
                if (response) {
                  web3 = new Web3(
                    new Web3.providers.HttpProvider(
                      response.enviroment == 'prod' ? process.env.INFURA_MAINET : process.env.INFURA_DEV
                    )
                  );
                  var MyContract = new web3.eth.Contract(config.abi, response.constract);
                  let data = request.payload.value == 0 ? MyContract.methods.ClamFree().encodeABI() : '0x';
                  const nonce = await web3.eth.getTransactionCount(request.payload.address);
                  const gasPrice = await web3.eth.getGasPrice();
                  const gasPriceHex =
                    request.payload.network === 1
                      ? web3.utils.toHex(Math.round(gasPrice))
                      : web3.utils.toHex(Math.round(gasPrice * 10));
                  const gasLimitHex = web3.utils.toHex(200000);
                  const value =
                    request.payload.value == 0
                      ? web3.utils.toHex(convertBalanceToWei(response.feeClaim || 0.003082))
                      : web3.utils.toHex(convertBalanceToWei(request.payload.value));
                  const result = {
                    data,
                    nonece: '0x' + nonce.toString(16),
                    gas: gasPriceHex,
                    limit: gasLimitHex,
                    value,
                    constractAddress: response.enviroment === 'prod' ? response.constract : process.env.CONSTRACT_DEV
                  };
                  return h.response({
                    message: 'success get data',
                    data: { ...result }
                  });
                }
                return h.response({
                  err: true,
                  message: 'eror get config'
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
        },
        {
          method: 'put',
          path: '/v1/web3/info/{id}',
          options: {
            auth: 'jwt',
            handler: async (request, h) => {
              try {
                const id = request.params.id;
                const payload = request.payload.constract;
                // const update = configModel.update(
                //   { _id: request.params.id },
                //   {
                //     $set: {
                //       contract: request.payload.contract
                //     }
                //   }
                // );
                const update = await updateModel(id, payload);
                console.log('update', update);
                if (update) {
                  return h.response({
                    message: 'success edit',
                    update
                  });
                }
              } catch (error) {
                console.log(error);
                // return h.response({
                //   err: true,
                //   message: error
                // });
              }
            },
            description: 'update config',
            notes: ['update config'],
            plugins: {
              'hapi-swagger': {
                payloadType: 'form'
              }
            },
            validate: {
              params: Joi.object({
                id: Joi.string()
              }),
              payload: Joi.object({
                constract: Joi.string()
              })
            },
            tags: ['api']
          }
        }
        // {
        //   method: 'GET',
        //   path: '/token',
        //   options: {
        //     auth: false,
        //     tags: ['api'],
        //     handler: () => {
        //       return { token: token };
        //     }
        //   }
        // }
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
  },
  err => {
    console.log(err);
  }
);
