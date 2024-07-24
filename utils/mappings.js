const timeZoneMapping = {
    'US': {
        timezones: {
            'PST': 'America/Los_Angeles',
            'EST': 'America/New_York',
        },
        format: 'MM/DD/YYYY HH:mm'
    },
    'Europe': {
        timezones: {
            'CET': 'Europe/Paris',
            'GMT': 'Europe/London',
        },
        format: 'DD/MM/YYYY HH:mm'
    }
};

const refundMapping = {
    oldTOS: {
        phone: 4,
        'web app': 8
    },
    newTOS: {
        phone: 24,
        "web app": 16,
    },
    dateCutoff: "2020-01-02"
}

module.exports = {
    timeZoneMapping,
    refundMapping
}