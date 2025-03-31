const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


let countriesCache = null;

// Função para carregar todos os países e armazenar em cache
async function loadAllCountries() {
    if (!countriesCache) {
        try {
            const response = await axios.get("https://restcountries.com/v3.1/all");
            countriesCache = response.data;
            console.log("Dados dos países carregados no cache.");
        } catch (error) {
            console.error("Erro ao carregar os dados dos países:", error);
        }
    }
}

// Carrega os dados ao iniciar o servidor
loadAllCountries();

// Rota para buscar países por nome, sigla ou moeda
app.get("/countries", async (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.status(400).json({ error: "Parâmetro 'search' é obrigatório." });
    }

    await loadAllCountries();
    
    const results = countriesCache.filter(country => {
        return (
            country.name.common.toLowerCase().includes(search.toLowerCase()) ||
            country.cca3.toLowerCase() === search.toLowerCase() ||
            (country.currencies && Object.keys(country.currencies).some(currency => currency.toLowerCase() === search.toLowerCase()))
        );
    }).map(country => ({
        name: country.name.common,
        code: country.cca3,
        currency: country.currencies ? Object.keys(country.currencies).join(", ") : "N/A",
        flag: country.flags.svg,
        regionalBlocks: country.regionalBlocs ? country.regionalBlocs.map(block => block.acronym).join(", ") : "N/A"
    }));

    res.json(results);
});

// Rota para buscar informações detalhadas de um país
app.get("/country/:code", async (req, res) => {
    const { code } = req.params;

    await loadAllCountries();

    const country = countriesCache.find(c => c.cca3.toLowerCase() === code.toLowerCase());
    
    if (!country) {
        return res.status(404).json({ error: "País não encontrado." });
    }

    res.json({
        name: country.name.common,
        population: country.population,
        timezone: country.timezones,
        currencies: country.currencies ? Object.keys(country.currencies).map(key => `${country.currencies[key].name} (${country.currencies[key].symbol})`).join(", ") : "N/A",
        languages: country.languages ? Object.values(country.languages).join(", ") : "N/A",
        capital: country.capital ? country.capital[0] : "N/A",
        regionalBlocks: country.regionalBlocs ? country.regionalBlocs.map(block => block.name).join(", ") : "N/A",
        borders: country.borders || []
    });
});

// Rota para encontrar a rota entre dois países
app.get("/route", async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) {
        return res.status(400).json({ error: "Parâmetros 'start' e 'end' são obrigatórios." });
    }

    await loadAllCountries();
    
    const countriesMap = {};
    countriesCache.forEach(country => {
        countriesMap[country.cca3] = {
            name: country.name.common,
            borders: country.borders || []
        };
    });

    if (!(start in countriesMap) || !(end in countriesMap)) {
        return res.status(404).json({ error: "Um dos países não foi encontrado." });
    }

    // Algoritmo de busca BFS para encontrar a menor rota
    let queue = [[start]];
    let visited = new Set();
    visited.add(start);

    while (queue.length > 0) {
        let path = queue.shift();
        let lastCountry = path[path.length - 1];

        if (lastCountry === end) {
            return res.json({ route: path.map(c => countriesMap[c].name) });
        }

        for (let neighbor of countriesMap[lastCountry].borders) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }

    res.json({ route: "Nenhuma rota disponível." });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
