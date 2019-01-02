const {SQS} = require('aws-sdk')
const sqs = new SQS()
exports.handler = event => {
    const MessageAttributes = Object
        .keys(event.headers || {})
        .filter(key => !/^(CloudFront-|X-|Host|Via)/.test(key))
        .slice(0, 10) // max number of MessageAttributes is 10
        .reduce((hdrs, key) => {
            hdrs[key] = {
                DataType: 'String',
                StringValue: event.headers[key]
            }
            return hdrs
        }, {})
    return sqs
        .sendMessage({
            MessageBody: event.body,
            MessageAttributes,
            QueueUrl: process.env.SQS_QUEUE,
            MessageGroupId: event.path.substr(1),
            MessageDeduplicationId: event.requestContext.requestId
        })
        .promise()
        .then(() => ({statusCode: '202'}))
}
