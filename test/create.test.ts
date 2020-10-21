const AWS = require('aws-sdk');
AWS.config.update({region:'eu-west-1'});
const axios = require('axios');
import { aws4Interceptor } from 'aws4-axios';

const apiEndpoint = process.env.TODO_API_ENDPOINT;

if (!AWS.config.credentials) {
  console.log('try to get creds from ECSCredentials');
    AWS.config.credentials = new AWS.ECSCredentials({
      httpOptions: {timeout: 5000}, // 5 second timeout
  });
    if (!AWS.config.credentials) {
      console.log('try to get creds from EC2MetadataCredentials');
      new AWS.EC2MetadataCredentials({ httpOptions: {timeout: 5000} });
    }
}

console.log(`creds: ${JSON.stringify(AWS.config.credentials)}`);

test('create todo', async () => {

  const interceptor = aws4Interceptor({
    region: 'eu-west-1',
    service: 'execute-api',
  },
  {
    secretAccessKey: AWS.config.credentials.secretAccessKey,
    accessKeyId: AWS.config.credentials.accessKeyId,
    sessionToken: AWS.config.credentials.sessionToken
  });
  
  axios.interceptors.request.use(interceptor);
  axios.interceptors.response.use((response: any) => {
    return response;
  }, (error: any) => {
    return error.response;
  });

  // Create a new TODO
  const todoCreateRequest = {
    title: 'Create a new todo',
    content: 'This is a test of a new todo',
  };
  console.log('POST Address', apiEndpoint + '/todos');
  const createResponse = await axios.post(apiEndpoint + '/todos', todoCreateRequest);
  console.log('Response', createResponse.data);

  expect(createResponse.status).toBe(200);

  // Retrieve the TODO
  console.log('GET Address', apiEndpoint + '/todos/' + createResponse.data);
  const getResponse = await axios.get(apiEndpoint + '/todos/' + createResponse.data);
  console.log('Response', getResponse.data);

  expect(getResponse.status).toBe(200);
  expect(getResponse.data.title).toBe(todoCreateRequest.title);
  expect(getResponse.data.content).toBe(todoCreateRequest.content);
});