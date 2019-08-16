// **** FUNCIONES ****

  async function obtieneJson(url) {
    const response = await fetch(url);
    return response.json();
  }

  async function obtenerSitios() {
    const url = "https://api.mercadolibre.com/sites";
    return await obtieneJson(url);
  }

  async function completarMenuSitios() {
	let sitios = await obtenerSitios();
	sitios.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0 );
	app.sitios = await sitios;
  }

  async function buscarItemsPorSiteYSeller(site_id, seller_id) {
    const url = "https://api.mercadolibre.com/sites/" + site_id + "/search?seller_id=" + seller_id;
    return await obtieneJson(url);
  }

  async function obtenerDetalleDeCategoria(category_id) {
    const url = "https://api.mercadolibre.com/categories/" + category_id;
    return await obtieneJson(url);
  }

  async function llenarTabla(site_id, seller_id) {
    let items = await buscarItemsPorSiteYSeller(site_id, seller_id).then(json => json.results.map(function(x) {return {seller_id: x.seller.id, item_id: x.id, item_title: x.title, category_id: x.category_id}; }));

	for(let i=0; i<items.length; i++) {
		items[i].category_name = await obtenerDetalleDeCategoria(items[i].category_id).then(json => json.name);
	}

	app.resultados = app.resultados.concat(items);
  }


// **** EJECUCIÓN ****
	completarMenuSitios();


// **** VUE ****
  var app = new Vue({
    el: '#app',
    data: {
      inicializado: false,
      site_id: "",
      seller_id: [],
      resultados: [],
      sitios: []
    },
    methods: {
      onSubmit() {
        app.site_id = this.site_id;
        app.seller_id = this.seller_id.split(",");
        app.seller_id.forEach(function(x, i) {
          app.seller_id[i] = app.seller_id[i].trim();
          llenarTabla(app.site_id, app.seller_id[i]);
        });
        app.inicializado = true;
      },
      onReset() {
		app.site_id = "";
		app.seller_id = [];
        app.resultados = [];
        app.inicializado = false;
      },
      saveFile: function() {
        const blob = new Blob([JSON.stringify(app.resultados)], {type: 'text/plain'})
        const e = document.createEvent('MouseEvents'),
        a = document.createElement('a');
        a.download = "";
        app.seller_id.forEach(function(x) { a.download = a.download + x + "-" });
        a.download = a.download + app.site_id + ".json";
        a.href = window.URL.createObjectURL(blob);
        a.click();
        window.URL.revokeObjectURL(a.href);
      }
    }
  });

