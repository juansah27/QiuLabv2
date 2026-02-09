// Chart utility functions for analytics dashboard

// Calculate Key Performance Indicators
export const calculateKPIs = (data) => {
    if (!data || data.length === 0) {
        return {
            totalOrders: 0,
            totalFollowUp: 0,
            totalInvalidSKU: 0,
            belumInterface: 0,
            belumMasukXML: 0,
            diprosesFlexoFalse: 0
        };
    }

    const kpis = {
        totalOrders: data.length,
        totalFollowUp: 0,
        totalInvalidSKU: 0,
        belumInterface: 0,
        belumMasukXML: 0,
        diprosesFlexoFalse: 0
    };

    data.forEach(item => {
        // Count Follow Up status
        if (item['Status SC'] === 'Follow Up!') kpis.totalFollowUp++;

        // Count Invalid SKU
        if (item['Validasi SKU'] && item['Validasi SKU'].toString().includes('Invalid SKU')) {
            kpis.totalInvalidSKU++;
        }

        // Count belum interface
        if (item['Status Interfaced'] === 'No' || !item['Interface Date']) kpis.belumInterface++;

        // Count belum masuk XML
        if (!item['Data Masuk XML']) kpis.belumMasukXML++;

        // Count Diproses Flexo False
        if (item['Diproses Flexo'] === 'False' || item['Diproses Flexo'] === false) {
            kpis.diprosesFlexoFalse++;
        }
    });

    return kpis;
};

// Group data by sales channel
export const groupByChannel = (data) => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
        const channel = item.SalesChannel || 'Unknown';
        if (!acc[channel]) acc[channel] = 0;
        acc[channel]++;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
};

// Group data by channel with status breakdown
export const groupByChannelWithStatus = (data) => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
        const channel = item.SalesChannel || 'Unknown';
        const status = item['Status SC'] || 'Unknown';

        if (!acc[channel]) {
            acc[channel] = {
                name: channel,
                'Pending Verifikasi': 0,
                'Follow Up!': 0
            };
        }

        if (status === 'Pending Verifikasi') {
            acc[channel]['Pending Verifikasi']++;
        } else if (status === 'Follow Up!') {
            acc[channel]['Follow Up!']++;
        }

        return acc;
    }, {});

    return Object.values(grouped).sort((a, b) =>
        (b['Pending Verifikasi'] + b['Follow Up!']) - (a['Pending Verifikasi'] + a['Follow Up!'])
    );
};

// Get interface status distribution
export const getInterfaceStatus = (data) => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
        const status = item['Status Interfaced'] || 'Unknown';
        if (!acc[status]) acc[status] = 0;
        acc[status]++;
        return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({
        name: name === 'Yes' ? 'Sudah Interface' : 'Belum Interface',
        value
    }));
};

// Get top brands with Follow Up status
export const getTopBrandsFollowUp = (data) => {
    if (!data || data.length === 0) return [];

    const followUpData = data.filter(item => item['Status SC'] === 'Follow Up!');

    const grouped = followUpData.reduce((acc, item) => {
        const brand = item.Brand || 'Unknown';
        if (!acc[brand]) acc[brand] = 0;
        acc[brand]++;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10
};

// Group by transporter
export const groupByTransporter = (data, includeIssues = false) => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
        const transporter = item.Transporter || 'Unknown';

        if (!acc[transporter]) {
            acc[transporter] = {
                name: transporter,
                count: 0,
                issues: 0
            };
        }

        acc[transporter].count++;

        if (includeIssues && item['Status SC'] === 'Follow Up!') {
            acc[transporter].issues++;
        }

        return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.count - a.count);
};

// Group by WH Location with issues
export const groupByWHLocWithIssues = (data) => {
    if (!data || data.length === 0) return [];

    const grouped = data.reduce((acc, item) => {
        const whLoc = item['WH Loc'] || 'Unknown';

        if (!acc[whLoc]) {
            acc[whLoc] = {
                name: whLoc,
                total: 0,
                issues: 0
            };
        }

        acc[whLoc].total++;

        if (item['Validasi SKU'] && item['Validasi SKU'].toString().includes('Invalid SKU')) {
            acc[whLoc].issues++;
        }

        return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.issues - a.issues);
};

// Extract hourly data from order dates
export const extractHourlyData = (data) => {
    if (!data || data.length === 0) return [];

    const hourly = {};

    // Initialize hours 0-23
    for (let i = 0; i < 24; i++) {
        hourly[i] = {
            hour: `${i.toString().padStart(2, '0')}:00`,
            total: 0,
            followUp: 0
        };
    }

    data.forEach(item => {
        if (!item.OrderDate) return;

        try {
            const date = new Date(item.OrderDate);
            const hour = date.getHours();

            if (hour >= 0 && hour < 24) {
                hourly[hour].total++;

                if (item['Status SC'] === 'Follow Up!') {
                    hourly[hour].followUp++;
                }
            }
        } catch (e) {
            // Invalid date, skip
        }
    });

    return Object.values(hourly);
};

// Build funnel data showing system flow
export const buildFunnelData = (data) => {
    if (!data || data.length === 0) return [];

    const funnel = {
        'Total Orders': data.length,
        'Masuk CMS': data.filter(item => item['Data Masuk CMS']).length,
        'Masuk XML': data.filter(item => item['Data Masuk XML']).length,
        'Sudah Interface': data.filter(item => item['Status Interfaced'] === 'Yes' || item['Interface Date']).length,
        'Diproses Flexo': data.filter(item => item['Diproses Flexo'] === 'True' || item['Diproses Flexo'] === true).length
    };

    return Object.entries(funnel).map(([name, value]) => ({
        name,
        value
    }));
};

// Get invalid SKU by channel
export const getInvalidSKUByChannel = (data) => {
    if (!data || data.length === 0) return [];

    const invalidData = data.filter(item =>
        item['Validasi SKU'] && item['Validasi SKU'].toString().includes('Invalid SKU')
    );

    const grouped = invalidData.reduce((acc, item) => {
        const channel = item.SalesChannel || 'Unknown';
        if (!acc[channel]) acc[channel] = 0;
        acc[channel]++;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
};

// Get invalid SKU by brand
export const getInvalidSKUByBrand = (data) => {
    if (!data || data.length === 0) return [];

    const invalidData = data.filter(item =>
        item['Validasi SKU'] && item['Validasi SKU'].toString().includes('Invalid SKU')
    );

    const grouped = invalidData.reduce((acc, item) => {
        const brand = item.Brand || 'Unknown';
        if (!acc[brand]) acc[brand] = 0;
        acc[brand]++;
        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10
};
