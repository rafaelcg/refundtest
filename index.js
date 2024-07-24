const express = require('express');
const path = require('path');

const fs = require('fs');

const csv = require('csv-parser');
const moment = require('moment-timezone');

const { timeZoneMapping, refundMapping } = require('./utils/mappings');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/refunds', (req, res) => {
    const results = [];
    const filePath = path.join(__dirname, 'refunds.csv');

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data, key) => {
            const convertToUTC = (date, time, timezone, requestType, isRefundRequest = false) => {
                if (time === null) {
                    time = '12:00';
                }
                const [region, timeZoneAbbr] = data['Customer Location (timezone)'].split(' (');
                const cleanTimeZoneAbbr = timeZoneAbbr.replace(')', '');
                const timeZone = timeZoneMapping[region].timezones[cleanTimeZoneAbbr];
                let dateObj = moment.tz(`${date}T${time}`, timeZoneMapping[region].format, timeZone);

                if (isRefundRequest && requestType === 'phone') {
                    const ukTime = dateObj.clone().tz('Europe/London');
                    const dayOfWeek = ukTime.day();
                    const hourOfDay = ukTime.hour();

                    if (dayOfWeek === 0 || dayOfWeek === 6 || hourOfDay < 9 || hourOfDay >= 17) {
                        if (hourOfDay >= 17) {
                            ukTime.add(1, 'day').startOf('day').hour(9);
                        } else if (hourOfDay < 9) {
                            ukTime.hour(9);
                        }

                        while (ukTime.day() === 0 || ukTime.day() === 6) {
                            ukTime.add(1, 'day');
                        }

                        dateObj = ukTime.utc();
                    }
                } else {
                    dateObj = dateObj.utc().subtract(1, 'hour');
                }

                return dateObj.format();
            };

            const checkisUserNewTos = (date) => {
                return date.isAfter(moment(refundMapping.dateCutoff));
            };

            const signUpDate = convertToUTC(data['Sign up date'], '00:00', data['Customer Location (timezone)'], data['Request Source']);
            const investmentDate = convertToUTC(data['Investment Date'], data['Investment Time'], data['Customer Location (timezone)'], data['Request Source']);
            const refundRequestDate = convertToUTC(data['Refund Request Date'], data['Refund Request Time'], data['Customer Location (timezone)'], data['Request Source'], true);

            const isNewTOS = checkisUserNewTos(moment(signUpDate));

            const checkRefundAllowed = (investmentDate, refundRequestDate, requestType, isNewTOS) => {
                const refundHours = isNewTOS ? refundMapping.newTOS[requestType] : refundMapping.oldTOS[requestType];

                console.log('refundRequestDate', refundRequestDate);
                console.log('investmentDate', investmentDate);
                console.log('refundHours', refundHours);

                return !refundRequestDate.isAfter(investmentDate.add(refundHours, 'hours'));
            };

            const normalizedData = {
                name: data.Name,
                signUpDate: convertToUTC(data['Sign up date'], null, data['Customer Location (timezone)'], data['Request Source']),
                requestSource: data['Request Source'],
                investmentDate: convertToUTC(data['Investment Date'], data['Investment Time'], data['Customer Location (timezone)'], data['Request Source']),
                refundRequestDate: convertToUTC(data['Refund Request Date'], data['Refund Request Time'], data['Customer Location (timezone)'], data['Request Source'], true),
                isNewTOS: isNewTOS,
                isRefundAllowed: checkRefundAllowed(moment(investmentDate), moment(refundRequestDate), data['Request Source'], isNewTOS),
            };

            results.push(normalizedData);
        })
        .on('end', () => {
            res.json(results);
        });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});