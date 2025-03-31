document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search");
    const searchButton = document.getElementById("searchBtn");
    const resultsDiv = document.getElementById("results");
    const detailsDiv = document.getElementById("details");

    // Função para buscar países
    async function fetchCountries(query) {
        try {
            const response = await fetch(`http://localhost:3000/countries?search=${query}`);
            const data = await response.json();
            displayResults(data);
        } catch (error) {
            console.error("Erro ao buscar países:", error);
        }
    }

    // Exibir lista de resultados
    function displayResults(countries) {
        resultsDiv.innerHTML = "";
        detailsDiv.style.display = "none";

        if (countries.length === 0) {
            resultsDiv.innerHTML = "<p>Nenhum país encontrado.</p>";
            return;
        }

        countries.forEach(country => {
            const countryElement = document.createElement("div");
            countryElement.innerHTML = `
                <img src="${country.flag}" width="50" alt="Bandeira">
                <strong>${country.name}</strong> (${country.code}) - Moeda: ${country.currency}
                <button onclick="fetchDetails('${country.code}')">Detalhes</button>
            `;
            resultsDiv.appendChild(countryElement);
        });
    }

    // Buscar detalhes do país
    async function fetchDetails(code) {
        try {
            const response = await fetch(`http://localhost:3000/country/${code}`);
            const data = await response.json();
            displayDetails(data);
        } catch (error) {
            console.error("Erro ao buscar detalhes do país:", error);
        }
    }

    // Exibir detalhes do país
    function displayDetails(country) {
        document.getElementById("flag").src = country.flag;
        document.getElementById("countryName").textContent = country.name;
        document.getElementById("capital").textContent = country.capital;
        document.getElementById("population").textContent = country.population.toLocaleString();
        document.getElementById("timezone").textContent = country.timezone;
        document.getElementById("currencies").textContent = country.currencies;
        document.getElementById("languages").textContent = country.languages;
        document.getElementById("regionalBlocks").textContent = country.regionalBlocks;
        document.getElementById("borders").textContent = country.borders.join(", ") || "N/A";

        detailsDiv.style.display = "block";
    }

    // Evento de busca ao clicar no botão ou pressionar Enter
    searchButton.addEventListener("click", () => {
        fetchCountries(searchInput.value.trim());
    });

    searchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            fetchCountries(searchInput.value.trim());
        }
    });
});
