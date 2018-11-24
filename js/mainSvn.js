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
		for (let numLinha in linhas) {
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
						this.dados.repos[repoDaVez] = {nome : repoDaVez, pastas : {}};
					}
					this.dados.repos[repoDaVez].pastas[pastaDaVez] = this.criarPastaObj(pastaDaVez);
				}
			} else {
				if (sintax_group) {
					let grupoMembros = linha.split("=");
					let grupo = grupoMembros[0].trim();
					var membros = [];
					if (grupoMembros[1].trim().length > 0) {
						let auxMembros = grupoMembros[1].split(",");
						for (let item in auxMembros) {
							if (auxMembros[item].trim().length > 0) {
								membros.push(auxMembros[item]);
							}
						}
					}
					this.dados.grupos[grupo] = membros;

				} else if (sintax_pasta) {
					if (linha.startsWith("@")) { // permissao num grupo
						var grupo = linha.split("=")[0].substring(1);
						this.dados.repos[repoDaVez].pastas[pastaDaVez].grupos.push({
							"nome" : grupo,
							permissao : linha.split("=")[1]
						});
					} else {
						var arrayUsuario = linha.split("=");
						var usuario = arrayUsuario[0].trim();
						this.dados.repos[repoDaVez].pastas[pastaDaVez].usuarios.push({
							"nome" : usuario,
							permissao : arrayUsuario[1].trim()
						});
					}
				}
			}
		}
	}

	this.plotarRegras = function () {
		$("#filtroGrupos").val("");
		$("#filtroPastas").val("");
		$("#filtroRepos").val("");

        $("#regrasTratadas").show();
        this.exibirGrupos();
		this.exibirRepositorios();
	}

	this.criarPastaObj = function(nomePasta) {
		return {
			nome : nomePasta,
			grupos : [],
			usuarios : []
		}
	}

	this.exibirGrupos = function () {
		let tableGrupos = $("#grupos tbody");
		$("#participantesGrupo").empty();

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

	this.exibirRepositorios = function() {
		var tableRepos = $("#repos tbody");
		tableRepos.empty();
		$("#repoPastas tbody").empty();
		$("#btnAddPasta").prop("disabled", true);

		$("#permissoes").empty()
		for (let repo in this.dados.repos) {
			var newTr = $('<tr id="repo_' + repo + '" class="tableItem"><td>' + repo + '</td></tr>');
			var oThis = this;
			newTr.click(function() {
                oThis.exibirPastas(repo);
			});
			tableRepos.append(newTr);
		}		
	}

	this.exibirParticipantes = function (grupo) {
		var divPerms = $("#participantesGrupo");
		divPerms.empty();
		$("#grupos tr").removeClass("participante");
		$("#grupo_" + grupo).addClass("participante");
		for (let num in this.dados.grupos[grupo]) {
			var oThis = this;
			var newA = this.createRemoveElement(function() {
				oThis.removerItem('participante', grupo, num);
			});
			var newHtml = $('<span class="participante">' + this.dados.grupos[grupo][num] +'</span>');
			newHtml.append(newA);

			divPerms.append(newHtml);
		}
		divPerms.append(this.botaoNovo('participante', grupo));
	}

	this.removerItem = function (tipoItem, subItem, indiceItem, subTipoItem) {
		if (tipoItem == 'participante') {
			this.dados.grupos[subItem].splice(indiceItem, 1);
			this.exibirParticipantes(subItem);
		} else if (tipoItem == 'permissao') {
			// nesse caso, subItem = pastaObj (Ex: tratador.dados.repos["painelbi"].pastas["/"])
			subItem[subTipoItem].splice(indiceItem, 1);
			this.exibirPermissoes(subItem);
		}
	}

	/**
	 * tipoItem -> participante, grupo, permissao
	 */
	this.botaoNovo = function(tipoItem, subItem) {
		var html;
		if (tipoItem == 'participante' || tipoItem == 'permissao') {
			html = $('<button class="btn">+</button>');
			var oThis = this;
			html.click(function() {
				oThis.adicionarItem(tipoItem, subItem);
			});
		}
		return html;
	}

	this.adicionarItem = function (tipoItem, subItem) {
		if (tipoItem == "participante") {
			let username = "";
			while (!this.validarNomeParticipante(username)) {
			 	username = prompt("Qual a nova matricula? (Digite algo)");
				if (username == undefined) {
					break;
				}
			}
			if (this.validarNomeParticipante(username)) {
				this.dados.grupos[subItem].push(username);
				this.exibirParticipantes(subItem);
			}
		} else if (tipoItem == "grupo") {
			let novoGrupo = "";
			while (!this.validarNomeGrupo(novoGrupo)) {
				novoGrupo = prompt("Qual o novo grupo? (Digite algo sem espaços ou caracteres especiais)", novoGrupo);
				if (novoGrupo == undefined) {
					break;
				}
			}
			if (this.validarNomeGrupo(novoGrupo) && !this.dados.grupos[novoGrupo]) {
				this.dados.grupos[novoGrupo] = [];
				this.exibirGrupos();
				this.exibirParticipantes(novoGrupo);
				this.scrollTo('grupo');
			}
		} else if (tipoItem == 'permissao') {
			// console.log(tipoItem + " - " + subItem);
			this.adicioarPermissao(subItem);
		} else if (tipoItem == "repo") {
			this.adicionarRepositorio(subItem);
		} else if (tipoItem == "pasta") {
			this.adicionarPasta(subItem);
		}
	};

	this.adicionarPasta = function(repoObj) {
		let novaPasta = "";
		while(!this.validarNomePasta(repoObj, novaPasta)) {
			novaPasta = prompt("Qual o caminho da pasta? (Digite algo)", novaPasta);
			if(novaPasta == undefined) return;
		}
		repoObj.pastas[novaPasta] = this.criarPastaObj(novaPasta);
		this.exibirPastas(repoObj);
		this.exibirPermissoes(repoObj.nome, novaPasta);
	};

	this.validarNomePasta = function(repoObj, nomePasta) {
		if(nomePasta == undefined || nomePasta.trim() == "") {
			return false;
		} else if (repoObj[nomePasta.trim()] != undefined) {
			alert("A pasta digitada já existe.");
			return false;
		}

		return true;
	}


	this.adicionarRepositorio = function(nomeRepo) {
		let novoRepo = nomeRepo;
		while(!this.validarNomeRepo(novoRepo)) {
			novoRepo = prompt("Qual o repositorio? (Digite algo sem espaços)");
			if (novoRepo == undefined) {
				return;
			}
		}
		this.dados.repos[novoRepo] = {nome : novoRepo, pastas : {}};
		this.exibirRepositorios();
		this.exibirPastas(novoRepo);
		this.scrollTo('repo');
	};

	this.validarNomeRepo = function(nomeRepo) {
		return nomeRepo && nomeRepo.trim() != "" && nomeRepo.indexOf(" ") < 0;
	};

	this.adicioarPermissao = function(pastaObj) {
		let novaPermissao = "";
		while (!this.validarPermissao(pastaObj, novaPermissao)) {
			novaPermissao = prompt("A quem dejesa conceder permissao? (Para grupos, utilize '@' no começo)", novaPermissao);
			if (novaPermissao == undefined) {
				return;
			}
		}
		let tipoPermissao = "";
		while (!this.validaTipoPermissao(tipoPermissao)) {
			tipoPermissao = prompt("Qual o tipo de permissão? (digite r ou rw)", tipoPermissao);
			if (tipoPermissao == undefined) {
				return;
			}
		}
		if(novaPermissao.startsWith("@")) {
			pastaObj.grupos.push({'nome' : novaPermissao.substring(1), 'permissao' : tipoPermissao});
		} else {
			pastaObj.usuarios.push({'nome' : novaPermissao, 'permissao' : tipoPermissao});
		}
		this.exibirPermissoes(pastaObj);
	}

	this.validaTipoPermissao = function(tipoPermissao) {
		return tipoPermissao && ['r', 'rw'].includes(tipoPermissao);
	};

	/**
	 * verifica o texto enviado por parãmetro. Pode ser um grupo (@xxxx) ou um usuário.
	 */
	this.validarPermissao = function(pastaObj, novaPermissao) {
		if (novaPermissao && novaPermissao.trim() != "") {
			if (novaPermissao.startsWith("@")) {
				let nomeGrupo = novaPermissao.substring(1);
				if (this.dados.grupos[nomeGrupo] == undefined) {
					alert("Escolha um grupo cadastrado. '" + nomeGrupo + "' não está cadastrado ainda.");
					return false;
				} else {
					for (let i in pastaObj.grupos) {
						if (pastaObj.grupos[i].nome == nomeGrupo) {
							alert("Grupo informado já possui permissão.");
							return false;
						}
					}
					return true;
				}
			} else {
				// Validar se permissão já existe
				for (let i in pastaObj.usuarios) {
					if (pastaObj.usuarios[i].nome == novaPermissao) {
						alert("Usuário informado já possui permissão.");
						return false;
					}
				}
				return true;
			}
		} else {
			return false;
		}
	}

	this.validarNomeParticipante = function(username) {
		return username && username.trim() != "";
	};

	// retorna true se o nome estiver ok
	this.validarNomeGrupo = function(novoGrupo) {
		return novoGrupo && novoGrupo.trim() != "" && novoGrupo.trim().indexOf(" ") < 0;
	}

	this.exibirPastas = function(repo) {
        let oThis = this;
        let repoObj = (typeof repo == 'object'? repo : this.dados.repos[repo]);

		$("#repos tbody tr").removeClass("participante");
		$("#repo_" + repoObj.nome).addClass("participante");
		let btnAddPasta = $("#btnAddPasta");
		btnAddPasta.prop("disabled", false);
		btnAddPasta.off('click');

		btnAddPasta.click(function() {
			oThis.adicionarItem('pasta', repoObj);
		});

		$("#permissoes").empty()

		var tableRepoPastas = $("#repoPastas tbody");
		tableRepoPastas.empty();
		for (let pasta in repoObj.pastas) {
            let newTr = $('<tr id="pasta_' + this.tratarNomePasta(pasta) + '" class="tableItem"><td>' + pasta + '</td></tr>');
			newTr.click(function () {
                oThis.exibirPermissoes(repoObj.nome, pasta);
			});
			tableRepoPastas.append(newTr);
		}
	}

	this.exibirPermissoes = function (repo, pasta) {
		let divPerms = $("#permissoes");
		divPerms.empty();
		let pastaObj;
		if (typeof repo == "object") {
			pastaObj = repo;
		} else {
			pastaObj = this.dados.repos[repo].pastas[pasta];
		}

		$("#repoPastas tr").removeClass("participante");
		$("#pasta_" + this.tratarNomePasta(pastaObj.nome)).addClass("participante");
		const oThis = this;

		for (let num in pastaObj.grupos) {

			let perm = pastaObj.grupos[num];
			const newSpan = $('<span class="participante">' + perm.nome + ' (' + perm.permissao + ')</span>');
			newSpan.click(function() {
                oThis.selecionaGrupo(perm.nome);
			});
			divPerms.append(newSpan);

			var newA = this.createRemoveElement(function() {
				oThis.removerItem('permissao', pastaObj, num, 'grupos');
			});
			newSpan.append(newA);


		}
		for (let num in pastaObj.usuarios) {
			var perm = pastaObj.usuarios[num];
			const newSpan = $('<span class="participante">' + perm.nome + ' (' + perm.permissao + ')</span>');
			divPerms.append(newSpan);

			var newA = this.createRemoveElement(function() {
				oThis.removerItem('permissao', pastaObj, num, 'usuarios');
			});
			newSpan.append(newA);
		}
		divPerms.append(this.botaoNovo('permissao', pastaObj));

	}

	this.createRemoveElement = function(callbackFunction) {
		let newElement = $('<a class="clicavel">x</a>');
		newElement.click(callbackFunction);
		return newElement;		
	}

	this.filtrarGrupos = function() {
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
		this.scrollTo('grupo');
	}

	/*
	Scroll to the selected object
	*/
	this.scrollTo = function(where) {
		if (where == 'grupo') {
			if ($("#grupos .participante")[0]) {
				$('#grupos .shortTable').animate({
					scrollTop : $("#grupos .participante").offset().top - $('#grupos .shortTable').offset().top
				}, 250);
			}
		} else if (where == 'repo') {
			if ($("#repos .participante")[0]) {
				$('#repos .shortTable').animate({
					scrollTop : $("#repos .participante").offset().top - $('#repos .shortTable').offset().top
				}, 500);
			}
		} else if (where == 'pasta') {
			if ($("#repoPastas .participante")[0]) {
				$('#repoPastas .shortTable').animate({
					scrollTop : $("#repoPastas .participante").offset().top - $('#repoPastas .shortTable').offset().top
				}, 500);
			}	
		}
	}

	this.filtrarRepos = function() {
		const filtro = $("#filtroRepos").val().toLowerCase();
		var repos = $("#repos tr");
		if (filtro.trim() == "") {
			repos.show();
		} else {
			repos.each(function(i) {
				let nomeRepo = this.id.substring(5).toLowerCase();
				if (nomeRepo.indexOf(filtro) >= 0) {
					$(this).show();
				} else {
					// console.log("Escondendo(" + filtro + "): " + nomeRepo);
					$(this).hide();
				}
			});
		}
		this.scrollTo('repo');
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
		this.scrollTo('pasta');
	}

	this.tratarNomePasta = function (pasta) {
		return pasta.replace(new RegExp("/", 'g'), "_")
	}

	this.selecionaGrupo = function (grupo) {
		this.exibirParticipantes(grupo);
		this.scrollTo('grupo');
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
		for (let repo in this.dados.repos) {
			for (let pasta in this.dados.repos[repo].pastas) {
				result += "[" + repo + ":" + pasta + "]\n";
				var objPasta = this.dados.repos[repo].pastas[pasta];
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

	this.finalizarEdicao = function(selectorComponente) {
		this.exportToText(selectorComponente);
		$("#regrasTratadas").hide();
	};

	this.showUserReport = function() {
		// TODO userData.grupos deve possui até os grupos indiretos
		// para cada usuario: grupos : {}, permissoes : {}
		let userData = { };
		// verificando grupos
		for (let grupo in this.dados.grupos) {
			let grupoObj = this.dados.grupos[grupo];
			for (let i in grupoObj) {
				let nomeParticipante = grupoObj[i];
				if (!nomeParticipante.startsWith("@")) {
					if (!userData[nomeParticipante]) {
						userData[nomeParticipante] = {grupos : {}, permissoes : []};
					}
					userData[nomeParticipante].grupos[grupo] = "Possui " + grupoObj.length + " participante(s).";
				}
			}
		}

		for (let repo in this.dados.repos) {
			let repoObj = this.dados.repos[repo];
			for (let pasta in repoObj.pastas) {
				let pastaObj = repoObj.pastas[pasta];
				for (let indGrupo in pastaObj.grupos) {
					let grupo = pastaObj.grupos[indGrupo];
					let itensGrupo = this.dados.grupos[grupo.nome];
					if (itensGrupo) {
						// console.log(pasta + " - " + itensGrupo.length + " -- ");
						for (let indice in itensGrupo) {
							let nomeParticipante = itensGrupo[indice];
							if (!userData[nomeParticipante]) {
								userData[nomeParticipante] = {grupos : {}, permissoes : []};
							}
							userData[nomeParticipante].permissoes.push(repoObj.nome + ":" + pastaObj.nome + " (" + grupo.permissao + " pelo grupo " + grupo.nome + ")");
						}
					}
				}

			}
		}

		return userData;
	}
};