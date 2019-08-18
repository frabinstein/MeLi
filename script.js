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
    let items = await buscarItemsPorSiteYSeller(site_id, seller_id)
    .then(json => json.results.map(x => {return {seller_id: x.seller.id, item_id: x.id, item_title: x.title, category_id: x.category_id}; }));

	for(let i=0; i<items.length; i++) {
		items[i].category_name = await obtenerDetalleDeCategoria(items[i].category_id)
        .then(json => json.name);
	}

    console.log("items = " + JSON.stringify(items));
    return items;
  }


// **** EJECUCIÓN ****
	completarMenuSitios();


// **** VUE ****
  var app = new Vue({
    el: '#app',
    data: {
      inicializado: false,
      finalizado: false,
      site_id: "",
      seller_id: [],
      resultados: [],
      sitios: []
    },
    methods: {
      async onSubmit() {
        app.inicializado = true;
        app.site_id = this.site_id;
        if(typeof app.seller_id === "string") {
          app.seller_id = this.seller_id.split(",");
        }
        let resultadosParciales = app.seller_id.map(async(x, i) => {
          app.seller_id[i] = app.seller_id[i].trim();
          console.log("corrida " + i);
          return await llenarTabla(app.site_id, app.seller_id[i]);
        });
/*
        resultadosParciales = app.seller_id.reduce(async(v, x, i) => {
            app.seller_id[i] = app.seller_id[i].trim();
            console.log("corrida " + i);
            return v.concat(await llenarTabla(app.site_id, app.seller_id[i]));
          }, []);
        console.log("resultadosParciales = " + JSON.stringify(await Promise.all(resultadosParciales)));
        console.log("resultadosParciales reducidos = " + JSON.stringify(await Promise.all(resultadosParciales.reduce(function(v, x) { return v.concat(x); }, []))));
        app.resultados = await Promise.all(resultadosParciales.reduce(function(v, x) { return v.concat(x); }, []));
*/
        app.resultados = await Promise.all(resultadosParciales);
        app.resultados = app.resultados.reduce(function(v, x) { return v.concat(x); }, []);
        console.log("finalizado");
        app.finalizado = true;
      },
      onReset() {
		app.site_id = "";
		app.seller_id = [];
        app.resultados = [];
        app.inicializado = false;
        app.finalizado = false;
      },
      saveFile: function() {
        const blob = new Blob([JSON.stringify(app.resultados)], {type: 'text/plain'})
        const e = document.createEvent('MouseEvents'),
        a = document.createElement('a');
        a.download = "";
        app.seller_id.forEach(x => { a.download = a.download + x + "-" });
        a.download = a.download + app.site_id + ".json";
        a.href = window.URL.createObjectURL(blob);
        a.click();
        window.URL.revokeObjectURL(a.href);
      }
    }
  });

