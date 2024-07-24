const express = require('express');
const path = require('path');

const fs = require('fs');

const csv = require('csv-parser');
const moment = require('moment-timezone');

const { timeZoneMapping, refundMapping } = require('./utils/mappings');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/refunds', (req, res) => {
    const results = [];
    const filePath = path.join(__dirname, 'refunds.csv');

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data, key) => {
            const convertToUTC = (date, time, timezone) => {
                if (time === null) {
                    time = '12:00';
                }
                const [region, timeZoneAbbr] = data['Customer Location (timezone)'].split(' (');
                const cleanTimeZoneAbbr = timeZoneAbbr.replace(')', '');
                const timeZone = timeZoneMapping[region].timezones[cleanTimeZoneAbbr];
                const dateObj = moment.tz(`${date}T${time}`, timeZoneMapping[region].format, timeZone);

                const utcTime = dateObj.utc().subtract(1, 'hour').format();
                return utcTime;
            };

            const checkisUserNewTos = (date) => {
                return date.isAfter(moment('2020-01-02'));
            };

            const signUpDate = convertToUTC(data['Sign up date'], '00:00', data['Customer Location (timezone)']);
            const investmentDate = convertToUTC(data['Investment Date'], data['Investment Time'], data['Customer Location (timezone)']);
            const refundRequestDate = convertToUTC(data['Refund Request Date'], data['Refund Request Time'], data['Customer Location (timezone)']);

            const isNewTOS = checkisUserNewTos(moment(signUpDate));

            const checkRefundAllowed = (investmentDate, refundRequestDate, requestType, isNewTOS) => {
                const refundHours = isNewTOS ? refundMapping.newTOS[requestType] : refundMapping.oldTOS[requestType];

                if (requestType === 'phone') {
                    const ukTime = moment.tz(refundRequestDate, 'Europe/London');
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

                        refundRequestDate = ukTime.utc();
                    }
                }

                return !refundRequestDate.isAfter(investmentDate.add(refundHours, 'hours'));
            };

            const normalizedData = {
                name: data.Name,
                timezone: data['Customer Location (timezone)'],
                signUpDate: convertToUTC(data['Sign up date'], null, data['Customer Location (timezone)']),
                requestSource: data['Request Source'],
                investmentDate: convertToUTC(data['Investment Date'], data['Investment Time'], data['Customer Location (timezone)']),
                refundRequestDate: convertToUTC(data['Refund Request Date'], data['Refund Request Time'], data['Customer Location (timezone)']),
                isNewTOS: isNewTOS,
                isRefundAllowed: checkRefundAllowed(moment(investmentDate), moment(refundRequestDate), data['Request Source'], isNewTOS),
                refundAllowedAmountHours: refundMapping[isNewTOS ? 'newTOS' : 'oldTOS'][data['Request Source']],
                dayOfWeekRequest: moment(refundRequestDate).format('dddd'),
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
