/**
 * 
 */
function AccessRulesHelper () {
	this.dados = {
		grupos : {},
		repos : {},
		usuarios : {}
	};

	this.tratarRegras = function (texto) {
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
					if (!this.dados.repos[repoDaVez]) {
						this.dados.repos[repoDaVez] = {};
					}
					this.dados.repos[repoDaVez][pastaDaVez] = {
						grupos : [],
						usuarios : []
					};
				}
			} else {
				if (sintax_group) {
					var grupoMembros = linha.split("=");
					var grupo = grupoMembros[0].trim();
					var membros = grupoMembros[1].split(",");
					this.dados.grupos[grupo] = membros;
				} else if (sintax_pasta) {
					if (linha.startsWith("@")) { // permissao num grupo
						var grupo = linha.split("=")[0].substring(1);
						this.dados.repos[repoDaVez][pastaDaVez].grupos.push({
							"nome" : grupo,
							permissao : linha.split("=")[1]
						});
					} else {
						var arrayUsuario = linha.split("=");
						var usuario = arrayUsuario[0].trim();
						this.dados.repos[repoDaVez][pastaDaVez].usuarios.push({
							"nome" : usuario,
							permissao : arrayUsuario[1].trim()
						});
					}
				}
			}
		}
	}

	this.plotarRegras = function () {
        $("#regrasTratadas").show();
        this.exibirGrupos();
		var tableRepos = $("#repos tbody");
		for (let repo in this.dados.repos) {
			var newTr = $('<tr id="repo_' + repo + '" class="tableItem"><td>' + repo + '</td></tr>');
			var oThis = this;
			newTr.click(function() {
                oThis.exibirPastas(repo);
			});
			tableRepos.append(newTr);
		}
	}

	this.exibirGrupos = function () {
		let tableGrupos = $("#grupos tbody");
		tableGrupos.empty();
		for (let grupo in this.dados.grupos) {
			var newTr = $('<tr id="grupo_' + grupo + '" class="tableItem"><td>' + grupo + '</td></tr>');
			var outerThis = this;
			newTr.click(function () {
				outerThis.exibirParticipantes(grupo);
			});
			tableGrupos.append(newTr);
		}	
	}

	this.exibirParticipantes = function (grupo) {
		var divPerms = $("#participantesGrupo");
		divPerms.empty();
		$("#grupos tr").removeClass("participante");
		$("#grupo_" + grupo).addClass("participante");
		var num = 0;
		for ( num in this.dados.grupos[grupo]) {
			var newA = $('<a class="clicavel">x</a>');
			var oThis = this;
			newA.click(function() {
				oThis.removerItem('participante', grupo, num);
			});
			var newHtml = $('<span class="participante">' + this.dados.grupos[grupo][num] +'</span>');
			newHtml.append(newA);

			divPerms.append(newHtml);
		}
		divPerms.append(this.botaoNovo('participante', grupo));
	}

	this.removerItem = function (tipoItem, subItem, indiceItem) {
		if (tipoItem == 'participante') {
			this.dados.grupos[subItem].splice(indiceItem, 1);
			this.exibirParticipantes(subItem);
		}
	}

	/**
	 * tipoItem -> participante, grupo, permissao
	 */
	this.botaoNovo = function(tipoItem, subItem) {
		var html;
		if (tipoItem == 'participante') {
			html = $('<button><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>');
			var oThis = this;
			html.click(function() {
				oThis.adicionarItem(tipoItem, subItem);
			});
		}
		return html;
	}

	this.adicionarItem = function (tipoItem, subItem) {
		if (tipoItem == "participante") {
			var username = "";
			while (username.trim() == "") {
			 	username = prompt("Qual a nova matricula? (Digite algo)");
			}
			this.dados.grupos[subItem].push(username);
			this.exibirParticipantes(subItem);
		} else if (tipoItem == "grupo") {
			let novoGrupo = "";
			while (novoGrupo.trim() == "") {
				novoGrupo = prompt("Qual o novo grupo? (Digite algo)");
				if (!this.dados.grupos[novoGrupo]) {
					this.dados.grupos[novoGrupo] = [];
				}
			}
			this.exibirGrupos();
			this.exibirParticipantes(novoGrupo);
			this.scrollToGrupo();
		}

	}

	this.exibirPastas = function (repo) {
		$("#repos tbody tr").removeClass("participante");
		$("#repo_" + repo).addClass("participante");
		var tableRepoPastas = $("#repoPastas tbody");
		tableRepoPastas.empty();
		for (let pasta in this.dados.repos[repo]) {
            let newTr = $('<tr id="pasta_' + this.tratarNomePasta(pasta) + '" class="tableItem"><td>' + pasta + '</td></tr>');
            var oThis = this;
			newTr.click(function () {
                oThis.exibirPermissoes(repo, pasta);
			});
			tableRepoPastas.append(newTr);
		}
	}

	this.exibirPermissoes = function (repo, pasta) {
		let divPerms = $("#permissoes");
		divPerms.empty();
		$("#repoPastas tr").removeClass("participante");
		$("#pasta_" + this.tratarNomePasta(pasta)).addClass("participante");
		for (const num in this.dados.repos[repo][pasta].grupos) {
			const perm = this.dados.repos[repo][pasta].grupos[num];
			const newSpan = $('<span class="participante">' + perm.nome + ' (' + perm.permissao + ')</span>');
			const oThis = this;
			newSpan.click(function() {
                oThis.selecionaGrupo(perm.nome);
			});
			divPerms.append(newSpan);
		}
		for (var num in this.dados.repos[repo][pasta].usuarios) {
			var perm = this.dados.repos[repo][pasta].usuarios[num];
			divPerms.append('<span class="participante">' + perm.nome + ' (' + perm.permissao
					+ ')</span>');
		}

	}

	this.filtrarGrupos = function () {
		let filtro = $("#filtroGrupos").val().toLowerCase();
		let grupos = $("#grupos tr");
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
		this.scrollToGrupo();
	}

	this.scrollToGrupo = function () {
		if ($("#grupos .participante")[0]) {
			$('#grupos .shortTable').animate({
				scrollTop : $("#grupos .participante").offset().top - $('#grupos .shortTable').offset().top
			}, 250);
		}	
	}

	this.filtrarRepos = function () {
		const filtro = $("#filtroRepos").val().toLowerCase();
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

	this.filtrarPastas = function () {
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

	this.tratarNomePasta = function (pasta) {
		return pasta.replace(new RegExp("/", 'g'), "_")
	}

	this.selecionaGrupo = function (grupo) {
		this.exibirParticipantes(grupo);
		this.scrollToGrupo();
	}

	this.exportToText = function (selectorComponente) {
		let result = "[groups]\n";
		// Exporta os grupos
		for (let grupo in this.dados.grupos) {
			result += grupo+ "=";
			let membros = this.dados.grupos[grupo];
			let primeiro = true;
			for (let i in membros) {
				if (!primeiro) {
					result += ",";
				} else {
					primeiro = false;
				}
				result += membros[i];
			}
			result += "\n";
		}
		result += "\n";

		// Exportando pastas dos repositórios
		for (var repo in this.dados.repos) {
			for (var pasta in this.dados.repos[repo]) {
				result += "[" + repo + ":" + pasta + "]\n";
				var objPasta = this.dados.repos[repo][pasta];
				for (var i in objPasta.grupos) {
					result += "@" + objPasta.grupos[i].nome + "=" + objPasta.grupos[i].permissao + "\n";
				}
				for (var i in objPasta.usuarios) {
					result += objPasta.usuarios[i].nome + "=" + objPasta.usuarios[i].permissao + "\n";
				}
				result += "\n";
			}
		}
		if (selectorComponente) {
			$(selectorComponente).val(result);
		}
		return result;
	};

	this.cancelarEdicao = function() {
		$("#regrasTratadas").hide();
	};

};