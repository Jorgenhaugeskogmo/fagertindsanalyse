// Machine Learning Module - Clustering and Predictive Analysis
class MLAnalyzer {
    constructor() {
        this.clusters = [];
        this.clusterStats = {};
    }

    // Simple k-means clustering implementation
    kMeansClustering(data, k = 3, maxIterations = 100) {
        if (!data || data.length < k) return [];

        // Prepare feature vectors [yearsSinceMove, employeeChange, changePercent, employeesNow]
        const features = data.map(item => {
            const yearsSinceMove = item.yearsSinceMove || 0;
            const empChange = item.employeeChangeSinceMove || item.employeeChange || 0;
            const changePercent = parseFloat(item.changePercentSinceMove || item.employeeChangePercent || 0);
            const empNow = item.employeesNow || item.employeesAfter || 0;
            
            return {
                item: item,
                features: [
                    yearsSinceMove,
                    empChange / 100, // Normalize
                    changePercent / 100, // Normalize
                    empNow / 100 // Normalize
                ]
            };
        }).filter(f => f.features.every(v => !isNaN(v) && isFinite(v)));

        if (features.length < k) return [];

        // Initialize centroids randomly
        let centroids = this.initializeCentroids(features, k);
        let assignments = new Array(features.length).fill(0);
        let converged = false;
        let iteration = 0;

        while (!converged && iteration < maxIterations) {
            // Assign points to nearest centroid
            const newAssignments = features.map(f => 
                this.findNearestCentroid(f.features, centroids)
            );

            // Check convergence
            converged = newAssignments.every((a, i) => a === assignments[i]);
            assignments = newAssignments;

            // Update centroids
            centroids = this.updateCentroids(features, assignments, k);
            iteration++;
        }

        // Create clusters with statistics
        const clusters = [];
        for (let i = 0; i < k; i++) {
            const clusterItems = features
                .map((f, idx) => ({ ...f.item, clusterId: assignments[idx] }))
                .filter((_, idx) => assignments[idx] === i);
            
            if (clusterItems.length > 0) {
                clusters.push({
                    id: i,
                    items: clusterItems,
                    size: clusterItems.length,
                    centroid: centroids[i],
                    stats: this.calculateClusterStats(clusterItems)
                });
            }
        }

        this.clusters = clusters;
        this.assignClusterLabels();
        return clusters;
    }

    // Initialize centroids using k-means++
    initializeCentroids(features, k) {
        const centroids = [];
        
        // First centroid: random point
        const firstIdx = Math.floor(Math.random() * features.length);
        centroids.push([...features[firstIdx].features]);

        // Select remaining centroids
        for (let i = 1; i < k; i++) {
            const distances = features.map(f => {
                const minDist = Math.min(...centroids.map(c => 
                    this.euclideanDistance(f.features, c)
                ));
                return minDist * minDist;
            });

            const totalDist = distances.reduce((a, b) => a + b, 0);
            let threshold = Math.random() * totalDist;
            
            for (let j = 0; j < distances.length; j++) {
                threshold -= distances[j];
                if (threshold <= 0) {
                    centroids.push([...features[j].features]);
                    break;
                }
            }
        }

        return centroids;
    }

    // Find nearest centroid
    findNearestCentroid(point, centroids) {
        let minDist = Infinity;
        let nearest = 0;

        centroids.forEach((centroid, i) => {
            const dist = this.euclideanDistance(point, centroid);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        });

        return nearest;
    }

    // Euclidean distance
    euclideanDistance(a, b) {
        return Math.sqrt(
            a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
        );
    }

    // Update centroids
    updateCentroids(features, assignments, k) {
        const centroids = [];

        for (let i = 0; i < k; i++) {
            const clusterPoints = features
                .filter((_, idx) => assignments[idx] === i)
                .map(f => f.features);

            if (clusterPoints.length > 0) {
                const centroid = clusterPoints[0].map((_, dim) =>
                    clusterPoints.reduce((sum, p) => sum + p[dim], 0) / clusterPoints.length
                );
                centroids.push(centroid);
            } else {
                // If cluster is empty, reinitialize randomly
                const randomIdx = Math.floor(Math.random() * features.length);
                centroids.push([...features[randomIdx].features]);
            }
        }

        return centroids;
    }

    // Calculate cluster statistics
    calculateClusterStats(items) {
        const yearsSince = items.map(i => i.yearsSinceMove || 0);
        const changes = items.map(i => i.employeeChangeSinceMove || i.employeeChange || 0);
        const percentChanges = items.map(i => 
            parseFloat(i.changePercentSinceMove || i.employeeChangePercent || 0)
        );
        const sizes = items.map(i => i.employeesNow || i.employeesAfter || 0);

        return {
            avgYearsSinceMove: this.mean(yearsSince),
            avgChange: this.mean(changes),
            avgPercentChange: this.mean(percentChanges),
            avgSize: this.mean(sizes),
            medianChange: this.median(changes),
            stdDevChange: this.stdDev(changes)
        };
    }

    // Assign meaningful labels to clusters
    assignClusterLabels() {
        this.clusters.forEach(cluster => {
            const stats = cluster.stats;
            
            // Determine cluster profile
            if (stats.avgYearsSinceMove >= 7 && Math.abs(stats.avgPercentChange) > 30) {
                cluster.label = '🔴 Høy risiko - Utgående leieavtale';
                cluster.description = 'Flyttet for lenge siden med stor endring i ansatte';
                cluster.color = '#ef4444';
                cluster.risk = 'high';
            } else if (stats.avgYearsSinceMove >= 5 && Math.abs(stats.avgPercentChange) > 15) {
                cluster.label = '🟡 Medium risiko - Potensielt behov';
                cluster.description = 'Moderat tid siden flytting med signifikant endring';
                cluster.color = '#f59e0b';
                cluster.risk = 'medium';
            } else if (stats.avgPercentChange > 50) {
                cluster.label = '🟢 Høy vekst - Ekspansjon';
                cluster.description = 'Sterk vekst, kan trenge større lokaler snart';
                cluster.color = '#10b981';
                cluster.risk = 'growth';
            } else if (stats.avgPercentChange < -30) {
                cluster.label = '🔵 Nedgang - Nedskalering';
                cluster.description = 'Reduksjon i ansatte, kan trenge mindre lokaler';
                cluster.color = '#3b82f6';
                cluster.risk = 'decline';
            } else {
                cluster.label = '⚪ Stabil - Lav risiko';
                cluster.description = 'Stabile forhold, lite sannsynlig endring';
                cluster.color = '#6b7280';
                cluster.risk = 'low';
            }
        });
    }

    // Calculate risk score for a company (0-100)
    calculateRiskScore(item) {
        let score = 0;

        // Years since move (max 40 points)
        const yearsSince = item.yearsSinceMove || 0;
        if (yearsSince >= 8) score += 40;
        else if (yearsSince >= 5) score += 30;
        else if (yearsSince >= 3) score += 20;
        else score += 10;

        // Absolute employee change (max 30 points)
        const absChange = Math.abs(item.employeeChangeSinceMove || item.employeeChange || 0);
        if (absChange >= 100) score += 30;
        else if (absChange >= 50) score += 20;
        else if (absChange >= 20) score += 10;
        else score += 5;

        // Percent change (max 30 points)
        const percentChange = Math.abs(parseFloat(
            item.changePercentSinceMove || item.employeeChangePercent || 0
        ));
        if (percentChange >= 100) score += 30;
        else if (percentChange >= 50) score += 20;
        else if (percentChange >= 25) score += 10;
        else score += 5;

        return Math.min(score, 100);
    }

    // Statistical helpers
    mean(arr) {
        return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }

    median(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    stdDev(arr) {
        if (arr.length === 0) return 0;
        const avg = this.mean(arr);
        const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
        return Math.sqrt(this.mean(squareDiffs));
    }

    // Get cluster summary
    getClusterSummary() {
        return this.clusters.map(c => ({
            label: c.label,
            description: c.description,
            size: c.size,
            color: c.color,
            risk: c.risk,
            stats: c.stats
        }));
    }

    // Get high-risk companies
    getHighRiskCompanies(threshold = 70) {
        const allItems = this.clusters.flatMap(c => c.items);
        return allItems
            .map(item => ({
                ...item,
                riskScore: this.calculateRiskScore(item)
            }))
            .filter(item => item.riskScore >= threshold)
            .sort((a, b) => b.riskScore - a.riskScore);
    }
}

// Create global instance
const mlAnalyzer = new MLAnalyzer();

