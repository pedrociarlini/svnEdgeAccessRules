/**
 * 
 */
var dados = {
	grupos : {},
	repos : {},
	usuarios : {}
};
function tratarRegras(texto) {
	var sintax_group = false;
	var sintax_pasta = false;
	var pastaDaVez = "";
	var repoDaVez = "";
	var linhas = texto.split("\n");
	for ( var numLinha in linhas) {
		var linha = linhas[numLinha].trim();
		if (linha.trim() == "") {
			continue;
		} else if (linha.startsWith("[")) { // Verifica se é uma seção
			// console.log("Validando linha: " + linha);
			if (linha == "[groups]") { // verifica se é a seção de grupos
				sintax_group = true;
				sintax_pasta = false;
			} else { // caso seja pasta
				sintax_group = false;
				sintax_pasta = true;
				pastaDaVez = linha.substring(1, linha.length - 1);
				repoDaVez = pastaDaVez.split(":")[0];
				pastaDaVez = pastaDaVez.split(":")[1];
				// console.log(repoDaVez + " /// " + pastaDaVez);
				if (!dados.repos[repoDaVez]) {
					dados.repos[repoDaVez] = {};
				}
				dados.repos[repoDaVez][pastaDaVez] = {
					grupos : [],
					usuarios : []
				};
			}
		} else {
			if (sintax_group) {
				var grupoMembros = linha.split("=");
				var grupo = grupoMembros[0].trim();
				var membros = grupoMembros[1].split(",");
				dados.grupos[grupo] = membros;
			} else if (sintax_pasta) {
				if (linha.startsWith("@")) { // permissao num grupo
					var grupo = linha.split("=")[0].substring(1);
					dados.repos[repoDaVez][pastaDaVez].grupos.push({
						"nome" : grupo,
						permissao : linha.split("=")[1]
					});
				} else {
					var usuario = linha.split("=")[0].substring(1);
					dados.repos[repoDaVez][pastaDaVez].usuarios.push({
						"nome" : usuario,
						permissao : linha.split("=")[1]
					});
				}
			}
		}
	}
}

function plotarRegras() {
	var tableGrupos = $("#grupos tbody");
	for ( var grupo in dados.grupos) {
		tableGrupos.append('<tr id="grupo_' + grupo + '" class="tableItem" onclick="exibirParticipantes(\'' + grupo + '\')"><td>' + grupo
				+ '</td></tr>');
	}
	var tablePastas = $("#repos tbody");
	for ( var repo in dados.repos) {
		tablePastas.append('<tr id="repo_' + repo + '" class="tableItem" onclick="exibirPastas(\'' + repo + '\')"><td>' + repo + '</td></tr>');
	}
}

function exibirParticipantes(grupo) {
	var divPerms = $("#participantesGrupo");
	divPerms.empty();
	$("#grupos tr").removeClass("participante");
	$("#grupo_" + grupo).addClass("participante");
	var num = 0;
	for ( num in dados.grupos[grupo]) {
		divPerms.append('<span class="participante">' + dados.grupos[grupo][num] + ' <a onclick="removeItem()">x<a></span>');
	}
	divPerms.append(botaoNovo('participante', grupo));
}

/*
 * valoresPossiveis -> Uma lista para ser exibida como possíveis valores.
 */
function botaoNovo(tipoItem, subItem) {
	var html = "";
	if (tipoItem == 'participante') {
		html += '<button onclick="adicionarItem(\'' + tipoItem + '\',  \'' + subItem + '\')"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>';
	}
	return html;
}

function adicionarItem(tipoItem, subItem) {
	if (tipoItem == "participante") {
		var username = "";
		while (username.trim() == "") {
		 	username = prompt("Qual a nova matricula? (Digite algo)");
		}
		dados.grupos[subItem].push(username);
		exibirParticipantes(subItem);
	}

}


function exibirPastas(repo) {
	$("#repos tbody tr").removeClass("participante");
	$("#repo_" + repo).addClass("participante");

	var tableRepoPastas = $("#repoPastas tbody");
	tableRepoPastas.empty();
	for ( var pasta in dados.repos[repo]) {
		tableRepoPastas.append('<tr id="pasta_' + tratarNomePasta(pasta) + '" class="tableItem" onclick="exibirPermissoes(\'' + repo + '\', \''
				+ pasta + '\')"><td>' + pasta + '</td></tr>');
	}
}

function exibirPermissoes(repo, pasta) {
	var divPerms = $("#permissoes");
	divPerms.empty();
	$("#repoPastas tr").removeClass("participante");
	$("#pasta_" + tratarNomePasta(pasta)).addClass("participante");
	for ( var num in dados.repos[repo][pasta].grupos) {
		var perm = dados.repos[repo][pasta].grupos[num];
		divPerms.append('<span class="participante" onclick="selecionaGrupo(\'' + perm.nome + '\')">' + perm.nome + ' (' + perm.permissao
				+ ')</span>');
	}
}

function filtrarGrupos() {
	var filtro = $("#filtroGrupos").val().toLowerCase();
	var grupos = $("#grupos tr");
	if (filtro.trim() == "") {
		grupos.show();
	} else {
		grupos.each(function(i) {
			if (this.id.toLowerCase().indexOf(filtro) >= 0) {
				$(this).show();
			} else {
				$(this).hide();
			}
		});
	}
	scrollToGrupo();
}
function scrollToGrupo() {
	if ($("#grupos .participante")[0]) {
		$('#grupos .shortTable').animate({
			scrollTop : $("#grupos .participante").offset().top - $('#grupos .shortTable').offset().top
		}, 250);
	}	
}

function filtrarRepos() {
	var filtro = $("#filtroRepos").val().toLowerCase();
	var repos = $("#repos tr");
	if (filtro.trim() == "") {
		repos.show();
	} else {
		repos.each(function(i) {
			if (this.id.toLowerCase().indexOf(filtro) >= 0) {
				$(this).show();
			} else {
				// console.log("Escondendo(" + filtro + "): " + this.id);
				$(this).hide();
			}
		});
	}
	if ($("#repos .participante")[0]) {
		$('#repos .shortTable').animate({
			scrollTop : $("#repos .participante").offset().top - $('#repos .shortTable').offset().top
		}, 500);
	}
}

function filtrarPastas() {
	var filtro = $("#filtroPastas").val().toLowerCase();
	var repos = $("#repoPastas tr");
	if (filtro.trim() == "") {
		repos.show();
	} else {
		repos.each(function(i) {
			if (this.id.toLowerCase().indexOf(filtro) >= 0) {
				$(this).show();
			} else {
				// console.log("Escondendo(" + filtro + "): " + this.id);
				$(this).hide();
			}
		});
	}
	if ($("#repoPastas .participante")[0]) {
		$('#repoPastas .shortTable').animate({
			scrollTop : $("#repoPastas .participante").offset().top - $('#repoPastas .shortTable').offset().top
		}, 500);
	}	
}

function tratarNomePasta(pasta) {
	return pasta.replace(new RegExp("/", 'g'), "_")
}

function selecionaGrupo(grupo) {
	exibirParticipantes(grupo);
	scrollToGrupo();
}