import { identitycheck, validateAddress, policecheck, addApp, updateApp } from './apiClient';
import { v4 as uuidv4 } from 'uuid';

export async function checkPolicies(data, token) {
    const userId = JSON.parse(localStorage.getItem('authState')).decodedIDTokenPayload.sub;
    const address = {
        "addNum": data.number,
        "city": data.city,
        "district": data.district,
        "province": data.province,
        "postalCode": data.postalcode,
        "gramaDivNum": data.gramasewaDiv,
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // New Application Id
    const appId = uuidv4();

    let policyResults = {
        "identity": false,
        "address": false,
        "police": false,
    }

    // Add application with input data to DB.
    try {
        const app = {
            "appId": appId,
            "userId": userId,
            "issueDate": formattedDate,
            "status": "pending",
            "inputAddress": `${data.number}, ${data.city}, ${data.district}, ${data.province}, ${data.postalcode}, ${data.gramasewaDiv}`,
            "inputNIC": data.nic,
            "certLink": "https://example.com/certificate"
        };
        if ((await addApp(app, token)).status === 201) {
            // Check identity
            try {
                if ((await identitycheck(data.nic, token)).data === true) {
                    policyResults['identity'] = true;
                }
            } catch (e) {
                console.log(e);
            }


            // Check address
            try {
                if ((await validateAddress(address, token)).data === true) {
                    policyResults['address'] = true;
                }
            } catch (e) {
                console.log(e);
            }


            // Check police reports
            try {
                if ((await policecheck(data.nic, token)).data === true) {
                    policyResults['police'] = true;
                }
            } catch (e) {
                console.log(e);
            }


            // Generate report
            // TODO:
            // TODO: Update database
            // status = pending/approved/identityFailed/addressFailed/policeFailed/pending
            try {
                const result = await updateApp(appId, {
                    "status": "approved"
                }, token);
                console.log(result);
            } catch (e) {
                console.log(e);
            }

            // TODO: Send SMS
        } else {
            throw new Error('Error adding application to DB');
        }
    } catch (e) {
        console.log(e);
    }

    return policyResults.identity && policyResults.address && policyResults.police;
}