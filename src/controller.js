const axios = require('axios').default;
const MY_VERIFICATION_TOKEN = process.env.MY_VERIFICATION_TOKEN;
const { response } = require('express');
const request = require('request');
const page_ps_id = process.env.PAGE_PS_ID;

const getUserProfile = (ps_id) => {

    return new Promise((resolve, reject) => {
        request({
            "uri": `https://graph.facebook.com/${ps_id}?fields=first_name,last_name,profile_pic&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
            "method": "GET",
        }, (err, res, body) => {
            if (!err) {
                resolve(res.body);
            } else {
                reject(err.error.message);
            }
        });
    });

}

const getPageProfile = (ps_id) => {

    return new Promise((resolve, reject) => {
        request({
            "uri": `https://graph.facebook.com/${page_ps_id}?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
            "method": "GET",
        }, (err, res, body) => {
            if (!err) {
                resolve(res.body);
            } else {
                reject(err.error.message);
            }
        });
    });

}

const test = (req, res) => {
    return res.send("Hello Again")
}

const postWebhook = (req, res) => {
    let body = req.body;
    if (body.object === "page") {
        body.entry.forEach(function (entry) {

            let webhook_event = entry.messaging[0];
            if (webhook_event && webhook_event.message && webhook_event.message.text) {
                console.log(`\u{1F536} Detail info:`);
                getUserProfile(webhook_event.sender.id).then(x => {
                    const res_body = {
                        sender: x,
                        message: webhook_event.message.text,
                        timestamp: webhook_event.timestamp
                    }

                    console.log(res_body);

                });
            }

            res.status(200).json("EVENT_RECEIVED");

        });



        // Determine which webhooks were triggered and get sender PSIDs and locale, message content and more.

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
}

const getWebhook = (req, res) => {
    // Parse the query params
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === "subscribe" && token === MY_VERIFICATION_TOKEN) {
            // Respond with the challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}

function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {

        // Create the payload for a basic text message
        response = {
            "text": `You sent the message: "${received_message.text}`
        }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { "text": "Thanks!" }
    } else if (payload === 'no') {
        response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

async function sendMessage(req, res1) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": req.body.sender_psid
        },
        "message": {
            "text": req.body.response
        }
    }

    getPageProfile().then(pageProfile => {

        request({
            "uri": "https://graph.facebook.com/v2.6/me/messages",
            "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
            "method": "POST",
            "json": request_body
        }, (err, res, body) => {
            if (!err) {
                const res_body = {
                    sender: JSON.parse(pageProfile),
                    message: req.body.response,
                    timestamp: Date.now()
                }
                return res1.json(res_body);
            } else {
                return res1.send("Unable to send message:" + err);
            }
        });

    })

    // Send the HTTP request to the Messenger Platform

}


exports.test = test;
exports.getWebhook = getWebhook;
exports.postWebhook = postWebhook;
exports.sendMessage = sendMessage;