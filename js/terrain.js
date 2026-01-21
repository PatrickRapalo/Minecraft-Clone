// Terrain generator
export class TerrainGenerator {
    constructor() {
        this.seed = Math.random() * 1000;
    }

    noise2D(x, z) {
        const n = Math.sin(x * 0.1 + this.seed) * Math.cos(z * 0.1 + this.seed);
        return n;
    }

    getBiome(x, z) {
        const temperature = this.noise2D(x * 0.01, z * 0.01);
        const moisture = this.noise2D(x * 0.01 + 1000, z * 0.01 + 1000);

        if (temperature < -0.3) return 'snow';
        if (temperature > 0.4 && moisture < -0.2) return 'desert';
        if (moisture < -0.3) return 'plains';
        if (moisture > 0.3) return 'forest';
        return 'grassland';
    }

    getTerrainHeight(x, z) {
        const biome = this.getBiome(x, z);
        const baseNoise = this.noise2D(x * 0.02, z * 0.02);

        let height = 10 + baseNoise * 5;

        if (biome === 'snow') height += 3;
        if (biome === 'desert') height -= 2;

        return Math.floor(height);
    }

    getSurfaceBlock(biome) {
        switch (biome) {
            case 'snow': return 6;
            case 'desert': return 4;
            case 'plains': return 1;
            case 'forest': return 7;
            default: return 1;
        }
    }
}
