const axios = require("axios");

const cache = new Map();

const isPrivateIp = (ip) => {
    if (!ip) return true;

    return (
        ip === "localhost" ||
        ip === "::1" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        (
            ip.startsWith("172.") &&
            Number(ip.split(".")[1]) >= 16 &&
            Number(ip.split(".")[1]) <= 31
        )
    );
};

const getIpLocation = async (ip) => {
    if (!ip || isPrivateIp(ip)) {
        return null;
    }

    if (cache.has(ip)) {
        return cache.get(ip);
    }

    try {
        const response = await axios.get(
            `http://ip-api.com/json/${ip}`,
            {
                timeout: 5000,
                params: {
                    fields: "status,message,country,countryCode,regionName,city,lat,lon,isp,org,as"
                }
            }
        );

        const data = response.data;

        if (
            data.status !== "success" ||
            typeof data.lat !== "number" ||
            typeof data.lon !== "number"
        ) {
            return null;
        }

        const location = {
            latitude: data.lat,
            longitude: data.lon,
            city: data.city || null,
            region: data.regionName || null,
            country: data.country || null,
            countryCode: data.countryCode || null,
            organization: data.org || data.isp || null,
            asn: data.as || null
        };

        cache.set(ip, location);

        return location;

    } catch (error) {
        console.error(
            `IP geolocation failed for ${ip}:`,
            error.message
        );

        return null;
    }
};

module.exports = {
    getIpLocation,
    isPrivateIp
};
