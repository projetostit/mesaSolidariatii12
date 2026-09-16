"use strict";

// esses atalhos ajudam a encontrar elementos no HTML
const qs = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];

// Fonte única dos perfis públicos usados no cadastro, no login e nos dashboards.
const PERFIS_PUBLICOS = Object.freeze({
  BENEFICIARIO: Object.freeze({
    nomeExibicao: "BENEFICIÁRIO",
    nome: "Nome completo",
    titulo: "Informações do beneficiário",
    endereco: "Endereço residencial",
    tipoEndereco: "RESIDENCIAL",
    cadastro: "cadastro.html?perfil=BENEFICIARIO",
    dashboard: "dashboard_beneficiario.html",
  }),
  DOADOR: Object.freeze({
    nomeExibicao: "DOADOR",
    nome: "Nome do responsável pelo cadastro",
    titulo: "Informações do doador",
    endereco: "Endereço do doador",
    tipoEndereco: "RESIDENCIAL",
    cadastro: "cadastro.html?perfil=DOADOR",
    dashboard: "dashboard_doador.html",
  }),
  VOLUNTARIO: Object.freeze({
    nomeExibicao: "VOLUNTÁRIO",
    nome: "Nome completo",
    titulo: "Informações do voluntário",
    endereco: "Endereço residencial",
    tipoEndereco: "RESIDENCIAL",
    cadastro: "cadastro.html?perfil=VOLUNTARIO",
    dashboard: "dashboard_voluntario.html",
  }),
  PONTO_COLETA: Object.freeze({
    nomeExibicao: "PONTO DE COLETA",
    nome: "Nome do responsável",
    titulo: "Informações do ponto de coleta",
    endereco: "Endereço do ponto de coleta",
    tipoEndereco: "COMERCIAL",
    cadastro: "cadastro.html?perfil=PONTO_COLETA",
    dashboard: "dashboard_ponto.html",
  }),
});

// Perfis internos não aparecem no cadastro público. Eles só podem ser criados
// pelo backend, mas também precisam ter um destino após o login.
const PERFIS_INTERNOS = Object.freeze({
  ADMINISTRADOR: Object.freeze({
    nomeExibicao: "ADMINISTRADOR",
    dashboard: "dashboard_administrador.html",
  }),
});

const PERFIS_SISTEMA = Object.freeze({
  ...PERFIS_PUBLICOS,
  ...PERFIS_INTERNOS,
});

let usuarioLogado = null;

function obterUsuarioDaRespostaApi(conteudo) {
  const usuario = conteudo?.usuario;
  const perfilAtivoRecebido =
    conteudo?.perfil_ativo?.nome_perfil ||
    usuario?.perfil_ativo ||
    usuario?.perfilAtivo ||
    usuario?.perfil;
  const perfisRecebidos = Array.isArray(conteudo?.perfis)
    ? conteudo.perfis.map((perfil) =>
        typeof perfil === "string" ? perfil : perfil?.nome_perfil,
      )
    : Array.isArray(usuario?.perfis)
      ? usuario.perfis
      : [perfilAtivoRecebido];
  const perfis = [
    ...new Set(
      [...perfisRecebidos, perfilAtivoRecebido].filter(
        (perfil) => PERFIS_SISTEMA[perfil],
      ),
    ),
  ];
  const perfilAtivo = perfilAtivoRecebido || perfis[0];
  const nome = usuario?.nome_usuario || usuario?.nome || usuario?.email;

  if (
    !usuario ||
    typeof nome !== "string" ||
    !nome.trim() ||
    !perfis.length ||
    !PERFIS_SISTEMA[perfilAtivo]
  ) {
    throw new Error("A resposta da API não contém um usuário válido.");
  }

  return {
    nome: nome.trim(),
    perfil: perfilAtivo,
    perfis,
  };
}

function obterDashboardDoPerfil(perfil) {
  return PERFIS_SISTEMA[perfil]?.dashboard || null;
}

function aplicarUsuarioLogadoNaTela() {
  if (!usuarioLogado?.nome) return;

  const nomeCompleto = usuarioLogado.nome;
  const primeiroNome = nomeCompleto.split(" ")[0];
  const inicial = primeiroNome.charAt(0).toUpperCase();
  const tituloBoasVindas = qs("#titulo-boas-vindas");
  const nomeChip = qs("#nome-chip");
  const nomeExibido = qs("#gaveta-nome-exibido");
  const campoNome = qs("#gv-nome");

  if (tituloBoasVindas) {
    tituloBoasVindas.textContent = `Olá, ${primeiroNome}!`;
  }

  if (nomeChip) nomeChip.textContent = primeiroNome;
  if (nomeExibido) nomeExibido.textContent = nomeCompleto;
  if (campoNome) campoNome.value = nomeCompleto;

  ["#gaveta-avatar", "#avatar-inicial", "#avatar-chip"].forEach(
    (seletor) => {
      const avatar = qs(seletor);
      if (avatar) avatar.textContent = inicial;
    },
  );
}

// esse bloco mostra os elementos quando eles entram na tela
function observarElementos(seletores, opcoes = {}) {
  const elementos = qsa(seletores.join(", "));
  if (!elementos.length) return;

  const cfg = { threshold: 0.2, rootMargin: "0px 0px -10% 0px", ...opcoes };

  if (!("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.classList.add("visivel"));
    return;
  }

  const obs = new IntersectionObserver((entradas, o) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visivel");
      o.unobserve(e.target);
    });
  }, cfg);

  elementos.forEach((el) => obs.observe(el));
}

// esse bloco abre e fecha o menu de navegação no celular
function iniciarNavbar() {
  const botaoMenu = qs(".botao-menu");
  const menu = qs(".menu");
  if (!botaoMenu || !menu) return;

  botaoMenu.addEventListener("click", () => {
    const ativo = menu.classList.toggle("ativo");
    botaoMenu.setAttribute("aria-expanded", ativo ? "true" : "false");
  });

  qsa(".item-menu", menu).forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("ativo");
      botaoMenu.setAttribute("aria-expanded", "false");
    });
  });
}

// esse bloco leva a página suavemente até a seção escolhida
function iniciarSmoothScroll() {
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const alvo = qs(id);
      if (!alvo) return;
      e.preventDefault();
      window.scrollTo({
        top: alvo.getBoundingClientRect().top + window.scrollY - 80,
        behavior: "smooth",
      });
    });
  });
}

// esse bloco cuida do botão de doação e das animações da página inicial
function iniciarPaginaInicio() {
  const botaoDoar = qs("#botao-doar-agora");
  if (!botaoDoar) return;

  let redirecionando = false;

  const criarConfete = (x, y) => {
    const cores = ["#FF7A00", "#FFD54F", "#2E8B57", "#00123B", "#FFFFFF"];
    for (let i = 0; i < 100; i++) {
      const c = document.createElement("span");
      c.className = "confete";
      c.style.left = `${x}px`;
      c.style.top = `${y}px`;
      c.style.setProperty("--confete-x", `${(Math.random() - 0.5) * 200}px`);
      c.style.setProperty("--confete-y", `${-(Math.random() * 200 + 80)}px`);
      c.style.setProperty(
        "--confete-rotacao",
        `${(Math.random() - 0.5) * 360}deg`,
      );
      c.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 800);
    }
  };

  botaoDoar.addEventListener("click", (e) => {
    e.preventDefault();
    if (redirecionando) return;
    redirecionando = true;
    criarConfete(e.clientX + window.scrollX, e.clientY + window.scrollY);
    setTimeout(() => {
      window.location.href = "doador.html";
    }, 1500);
  });

  observarElementos([
    ".cartao-ajuda",
    ".cartao-publico",
    ".cartao-passo-funcionamento",
    ".cartao-seguranca",
    ".cartao-ods",
    ".cartao-empresa",
  ]);
}

// esse bloco anima os cartões da equipe na página sobre
function iniciarPaginaSobre() {
  const cards = qsa(".card-membro-sobre");
  if (!cards.length) return;

  observarElementos([
    ".conteiner-banner-sobre",
    ".cartao-mvv",
    ".etapa-linha-tempo",
    ".cartao-pilar-sobre",
    ".card-membro-sobre",
    ".conteiner-ods-sobre",
  ]);

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-social-membro")) return;
      card.classList.toggle("virado");
    });
  });
}

// esse bloco abre as respostas e filtra as perguntas do FAQ
function iniciarPaginaFaq() {
  const itensPergunta = qsa(".item-pergunta-faq");
  if (!itensPergunta.length) return;

  observarElementos([".faq-animado"], { threshold: 0.18 });

  itensPergunta.forEach((item) => {
    const cabecalho = qs(".cabecalho-pergunta-faq", item);
    const corpo = qs(".corpo-pergunta-faq", item);
    if (!cabecalho || !corpo) return;
    corpo.style.maxHeight = "0px";

    cabecalho.addEventListener("click", () => {
      const estaAberta = item.classList.contains("aberta");
      itensPergunta.forEach((outro) => {
        const c = qs(".corpo-pergunta-faq", outro);
        if (c) c.style.maxHeight = "0px";
        outro.classList.remove("aberta");
      });
      if (!estaAberta) {
        item.classList.add("aberta");
        corpo.style.maxHeight = corpo.scrollHeight + "px";
      }
    });
  });

  qsa(".botao-filtro-faq").forEach((botao) => {
    botao.addEventListener("click", () => {
      const filtro = botao.dataset.filtro || "todos";
      qsa(".botao-filtro-faq").forEach((b) => b.classList.remove("ativo"));
      botao.classList.add("ativo");
      itensPergunta.forEach((item) => {
        const cat = item.dataset.categoria || "geral";
        item.style.display =
          filtro === "todos" || cat === filtro || cat === "geral"
            ? "block"
            : "none";
      });
    });
  });

  const botaoTodos = qs('.botao-filtro-faq[data-filtro="todos"]');
  if (botaoTodos) botaoTodos.click();
}

// esse bloco anima os números e gráficos da página de impacto
function iniciarPaginaImpacto() {
  const secaoIndicadores = qs(".secao-indicadores-impacto");
  if (!secaoIndicadores) return;

  observarElementos([".impacto-animado"]);

  const numerosKpi = qsa(
    ".numero-indicador-impacto, .numero-kpi-hero, .porcentagem-central",
  );
  const barrasMes = qsa(".barra-mes");
  const blocoGrafico = qs(".bloco-grafico-barras");
  const secaoGraficos = qs(".secao-graficos-impacto");

  let numerosAnimados = false;
  let barrasAnimadas = false;
  let maxValor = 0;
  barrasMes.forEach((b) => {
    const v = Number(b.dataset.valor || 0);
    if (v > maxValor) maxValor = v;
  });

  // esse trecho faz os números crescerem até o valor final
  function animarNumeros() {
    if (numerosAnimados) return;
    numerosAnimados = true;
    numerosKpi.forEach((el) => {
      const attr = el.dataset.contador;
      let alvo,
        sufixo = "";
      if (attr && attr.trim()) {
        alvo = Number(String(attr).replace(/[^\d]/g, "")) || 0;
      } else {
        const txt = el.textContent || "";
        alvo = Number(txt.replace(/[^\d]/g, ""));
        if (!Number.isFinite(alvo) || alvo === 0) return;
        if (txt.includes("%")) sufixo = "%";
      }
      if (el.classList.contains("porcentagem-central") && !sufixo) sufixo = "%";
      let atual = 0;
      const passos = Math.max(Math.floor(1200 / 30), 1);
      const inc = alvo / passos;
      const t = setInterval(() => {
        atual += inc;
        if (atual >= alvo) {
          atual = alvo;
          clearInterval(t);
        }
        el.textContent = Math.round(atual).toLocaleString("pt-BR") + sufixo;
      }, 30);
    });
  }

  // esse trecho preenche as barras quando elas aparecem na tela
  function animarBarras() {
    if (barrasAnimadas || maxValor === 0) return;
    barrasAnimadas = true;
    barrasMes.forEach((b) => {
      b.style.height =
        Math.min((Number(b.dataset.valor || 0) / maxValor) * 100, 100) + "%";
    });
  }

  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          if (e.target.classList.contains("impacto-animado"))
            e.target.classList.add("visivel");
          if (e.target === secaoIndicadores || e.target === secaoGraficos) {
            animarNumeros();
            animarBarras();
          }
          if (e.target === blocoGrafico) animarBarras();
          o.unobserve(e.target);
        });
      },
      { threshold: 0.3 },
    );

    qsa(".impacto-animado").forEach((el) => obs.observe(el));
    if (secaoIndicadores) obs.observe(secaoIndicadores);
    if (secaoGraficos) obs.observe(secaoGraficos);
    if (blocoGrafico && !blocoGrafico.classList.contains("impacto-animado"))
      obs.observe(blocoGrafico);
  } else {
    qsa(".impacto-animado").forEach((el) => el.classList.add("visivel"));
    animarNumeros();
    animarBarras();
  }
}

// esse bloco organiza as animações da página de famílias
function iniciarPaginaFamilia() {
  const elementos = qsa(".familia-animado");
  if (!elementos.length) return;

  elementos.forEach((el, i) => {
    const atrasoAttr = el.getAttribute("data-atraso");
    const atraso = atrasoAttr !== null ? Number(atrasoAttr) : NaN;
    el.style.transitionDelay = Number.isFinite(atraso)
      ? `${atraso}s`
      : `${(i * 0.08).toFixed(2)}s`;
  });

  const revelar = (el) => el.classList.add("familia-visivel");

  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entradas, o) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          revelar(e.target);
          o.unobserve(e.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    elementos.forEach((el) => obs.observe(el));
  } else {
    elementos.forEach(revelar);
  }

  const botaoIniciar = qs(".botao-iniciar-cadastro-familia");
  const secaoCadastro = qs("#cadastro-familia");
  if (botaoIniciar && secaoCadastro) {
    botaoIniciar.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: secaoCadastro.getBoundingClientRect().top + window.scrollY - 80,
        behavior: "smooth",
      });
    });
  }
}

// esse bloco anima as etapas da página como funciona
function iniciarPaginaComoFunciona() {
  const grupos = qsa("[data-animar-grupo]");
  if (!grupos.length) return;

  document.body.classList.add("js-ativo");
  const elementos = [];
  grupos.forEach((grupo) => {
    qsa(".animar-entrada", grupo).forEach((el, i) => {
      el.style.transitionDelay = `${(i * 0.08).toFixed(2)}s`;
      elementos.push(el);
    });
  });

  if (!elementos.length) return;

  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entradas, o) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("visivel");
          o.unobserve(e.target);
        });
      },
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" },
    );
    elementos.forEach((el) => obs.observe(el));
  } else {
    elementos.forEach((el) => el.classList.add("visivel"));
  }
}

// esse bloco anima o conteúdo da página de voluntários
function iniciarPaginaVoluntario() {
  const elementos = qsa(".animar-entrada");
  if (!elementos.length || qs("[data-animar-grupo]")) return;
  if (qs(".secao-beneficios-voluntariado-nova") === null) return;

  document.body.classList.add("js-ativo");

  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entradas, o) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("visivel");
          o.unobserve(e.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    elementos.forEach((el) => obs.observe(el));
  } else {
    elementos.forEach((el) => el.classList.add("visivel"));
  }
}

// esse bloco controla as abas e animações da página de doadores
function iniciarPaginaDoador() {
  const abas = qsa(".aba-perfil");
  const paineis = qsa(".painel-perfil");
  if (!abas.length && !paineis.length) return;

  document.body.classList.add("js-ativo");

  const elementos = qsa(".animar-entrada");
  if (elementos.length && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entradas, o) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("visivel");
          o.unobserve(e.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );
    elementos.forEach((el) => obs.observe(el));
  }

  if (abas.length && paineis.length) {
    const ativar = (id) => {
      abas.forEach((a) => a.classList.toggle("ativa", a.dataset.aba === id));
      paineis.forEach((p) => p.classList.toggle("ativo", p.id === id));
    };
    abas.forEach((aba) =>
      aba.addEventListener("click", () => ativar(aba.dataset.aba)),
    );
  }
}

// esse bloco anima os cartões da página de empresas parceiras
function iniciarPaginaEmpresa() {
  const cards = qsa(
    ".cartao-motivo-empresa, .cartao-passo-empresa, .cartao-beneficio-empresa",
  );
  if (!cards.length) return;

  observarElementos([
    ".cartao-motivo-empresa",
    ".cartao-passo-empresa",
    ".cartao-beneficio-empresa",
  ]);
}

// esse bloco seleciona o perfil e valida o formulário de contato
function iniciarPaginaContato() {
  const formulario = qs("#form-contato");
  if (!formulario) return;

  const botoesPerfil = qsa(".botao-perfil");
  const textoPerfilSelecionado = qs("#texto-perfil-selecionado");
  const inputPerfil = qs("#perfil-contato");
  const mensagemErro = qs("#mensagem-erro-formulario");
  const mensagemSucesso = qs("#mensagem-sucesso-formulario");

  const validarEmail = (e) => /\S+@\S+\.\S+/.test(e);

  const atualizarPerfil = (perfil) => {
    if (textoPerfilSelecionado) textoPerfilSelecionado.textContent = perfil;
    if (inputPerfil) inputPerfil.value = perfil;
  };

  if (botoesPerfil.length) {
    botoesPerfil.forEach((b) => {
      b.addEventListener("click", () => {
        botoesPerfil.forEach((x) => x.classList.remove("botao-perfil-ativo"));
        b.classList.add("botao-perfil-ativo");
        atualizarPerfil(b.getAttribute("data-perfil") || b.textContent.trim());
      });
    });
    const inicial = qs(".botao-perfil.botao-perfil-ativo") || botoesPerfil[0];
    if (inicial)
      atualizarPerfil(inicial.getAttribute("data-perfil") || "Beneficiário");
  }

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();
    if (mensagemErro) mensagemErro.textContent = "";
    if (mensagemSucesso) mensagemSucesso.textContent = "";

    const nome = (qs("#nome-contato")?.value || "").trim();
    const email = (qs("#email-contato")?.value || "").trim();
    const assunto = qs("#assunto-contato")?.value || "";
    const mensagem = (qs("#mensagem-contato")?.value || "").trim();
    const aceite = qs("#aceite-contato")?.checked || false;
    const perfil = inputPerfil?.value || "";

    const erros = [];
    if (!nome) erros.push("Informe seu nome completo.");
    if (!email) erros.push("Informe um e-mail para contato.");
    else if (!validarEmail(email)) erros.push("Informe um e-mail válido.");
    if (!assunto) erros.push("Selecione um assunto.");
    if (!mensagem) erros.push("Escreva uma mensagem para a equipe.");
    if (!perfil) erros.push("Selecione seu perfil.");
    if (!aceite) erros.push("Confirme a autorização de contato.");

    if (erros.length) {
      if (mensagemErro) mensagemErro.textContent = erros.join(" ");
      return;
    }

    if (mensagemSucesso)
      mensagemSucesso.textContent =
        "Mensagem enviada com sucesso! Nossa equipe retornará em breve.";
    formulario.reset();
    if (botoesPerfil.length) {
      botoesPerfil.forEach((b) => b.classList.remove("botao-perfil-ativo"));
      const p = botoesPerfil[0];
      if (p) {
        p.classList.add("botao-perfil-ativo");
        atualizarPerfil(p.getAttribute("data-perfil") || "Beneficiário");
      }
    }
  });
}

// esse bloco mostra os campos certos e valida o cadastro de cada perfil
function iniciarPaginaCadastro() {
  "use strict";

  const form = document.getElementById("form-cadastro-unico");
  const perfil = document.getElementById("perfil-cadastro");
  const tipoEndereco = document.getElementById("tipo-endereco");
  const blocoEscolhaPerfil = document.getElementById("bloco-escolha-perfil");
  const perfilPreselecionadoResumo = document.getElementById(
    "perfil-preselecionado",
  );
  const nomePerfilPreselecionado = document.getElementById(
    "nome-perfil-preselecionado",
  );

  if (!form || !perfil || !tipoEndereco) return;

  const blocos = {
    comuns: document.getElementById("bloco-dados-comuns"),
    perfil: document.getElementById("bloco-dados-perfil"),
    endereco: document.getElementById("bloco-endereco"),
    acesso: document.getElementById("bloco-acesso-plataforma"),
    finalizacao: document.getElementById("bloco-finalizacao"),
  };

  const gruposPerfil = [...document.querySelectorAll(".grupo-perfil")];
  const nomeUsuario = document.getElementById("nome-usuario");
  const emailUsuario = document.getElementById("email-usuario");
  const erroEmailUsuario = document.getElementById("erro-email-usuario");
  const rotuloNomeUsuario = document.getElementById("rotulo-nome-usuario");
  const tituloDadosPerfil = document.getElementById("titulo-dados-perfil");
  const tituloEndereco = document.getElementById("titulo-endereco");
  const textoCadastro = document.getElementById("texto-cadastro");

  const tipoPessoaDoador = [
    ...document.querySelectorAll('input[name="tipoPessoa"]'),
  ];
  const camposIdentificacaoDoador = document.getElementById(
    "campos-identificacao-doador",
  );
  const campoTelefoneDoador = document.getElementById("campo-telefone-doador");
  const nomeRazaoSocial = document.getElementById("nome-razao-social");
  const documentoDoador = document.getElementById("documento-doador");
  const rotuloNomeDoador = document.getElementById("rotulo-nome-doador");
  const rotuloDocumentoDoador = document.getElementById(
    "rotulo-documento-doador",
  );

  const tipoHorarioVoluntario = document.getElementById(
    "tipo-horario-voluntario",
  );
  const horariosVoluntario = document.getElementById("horarios-voluntario");
  const horaInicio = document.getElementById("hora-inicio-voluntario");
  const horaFim = document.getElementById("hora-fim-voluntario");

  const senha = document.getElementById("senha-usuario");
  const confirmacaoSenha = document.getElementById("confirmacao-senha");
  const erroConfirmacaoSenha = document.getElementById(
    "erro-confirmacao-senha",
  );
  const botaoEnviar = document.getElementById("botao-principal-cadastro");
  const mensagemStatus = document.getElementById("mensagem-status-cadastro");
  const overlayConfirmacao = document.getElementById("overlay-confirmacao");
  const botaoConfirmacao = document.getElementById("botao-confirmacao");

  // esse trecho troca os campos conforme o perfil escolhido
  function setBlocoVisivel(bloco, visivel) {
    bloco.hidden = !visivel;

    bloco.querySelectorAll("input, select, textarea").forEach((campo) => {
      campo.disabled = !visivel;
    });
  }

  function setGrupoPerfilAtivo(perfilSelecionado) {
    gruposPerfil.forEach((grupo) => {
      const ativo = grupo.dataset.perfil === perfilSelecionado;
      grupo.hidden = !ativo;

      grupo.querySelectorAll("input, select, textarea").forEach((campo) => {
        campo.disabled = !ativo;
      });
    });

    atualizarCamposCondicionaisDoador();
    atualizarCamposCondicionaisVoluntario();
  }

  function atualizarTextosDoPerfil(perfilSelecionado) {
    const atual = PERFIS_PUBLICOS[perfilSelecionado];
    if (!atual) return;

    rotuloNomeUsuario.textContent = atual.nome;
    tituloDadosPerfil.textContent = atual.titulo;
    tituloEndereco.textContent = atual.endereco;
    tipoEndereco.value = atual.tipoEndereco;

    if (textoCadastro) {
      textoCadastro.textContent = `Preencha seus dados para criar sua conta como ${atual.nomeExibicao}.`;
    }
  }

  function atualizarCamposCondicionaisDoador() {
    const tipoSelecionado = form.querySelector(
      'input[name="tipoPessoa"]:checked',
    )?.value;
    const perfilDoadorAtivo =
      perfil.value === "DOADOR" && !blocos.perfil.hidden;
    const mostrar = perfilDoadorAtivo && Boolean(tipoSelecionado);

    camposIdentificacaoDoador.hidden = !mostrar;
    campoTelefoneDoador.hidden = !mostrar;

    [
      nomeRazaoSocial,
      documentoDoador,
      document.getElementById("telefone-doador"),
    ].forEach((campo) => {
      campo.disabled = !mostrar;
    });

    if (!mostrar) return;

    if (tipoSelecionado === "FISICA") {
      rotuloNomeDoador.textContent = "Nome do doador";
      rotuloDocumentoDoador.textContent = "CPF";
      documentoDoador.placeholder = "000.000.000-00";
      documentoDoador.maxLength = 14;
      documentoDoador.inputMode = "numeric";
      documentoDoador.autocapitalize = "off";
      documentoDoador.dataset.tipoDocumento = "CPF";

      if (!nomeRazaoSocial.value.trim()) {
        nomeRazaoSocial.value = nomeUsuario.value.trim();
      }
    } else {
      rotuloNomeDoador.textContent = "Razão social";
      rotuloDocumentoDoador.textContent = "CNPJ";
      documentoDoador.placeholder = "AA.AAA.AAA/AAAA-AA";
      documentoDoador.maxLength = 18;
      documentoDoador.inputMode = "text";
      documentoDoador.autocapitalize = "characters";
      documentoDoador.dataset.tipoDocumento = "CNPJ";
    }
  }

  function atualizarCamposCondicionaisVoluntario() {
    const mostrarHorarios =
      perfil.value === "VOLUNTARIO" &&
      tipoHorarioVoluntario.value === "PERSONALIZADO" &&
      !blocos.perfil.hidden;

    horariosVoluntario.hidden = !mostrarHorarios;
    horaInicio.disabled = !mostrarHorarios;
    horaFim.disabled = !mostrarHorarios;
    horaInicio.required = mostrarHorarios;
    horaFim.required = mostrarHorarios;
  }

  // esse trecho confere se as duas senhas são iguais
  function validarConfirmacaoSenha() {
    const senhasDiferentes =
      !senha.disabled &&
      confirmacaoSenha.value &&
      senha.value !== confirmacaoSenha.value;

    confirmacaoSenha.setCustomValidity(
      senhasDiferentes ? "As senhas informadas não são iguais." : "",
    );

    erroConfirmacaoSenha.textContent = senhasDiferentes
      ? "As senhas informadas não são iguais."
      : "";
  }

  function atualizarFluxo() {
    const perfilSelecionado = perfil.value;

    if (!perfilSelecionado) {
      Object.values(blocos).forEach((bloco) => setBlocoVisivel(bloco, false));
      setGrupoPerfilAtivo("");
      if (textoCadastro) {
        textoCadastro.textContent =
          "Preencha seus dados para criar sua conta no Mesa Solidária.";
      }
      return;
    }

    atualizarTextosDoPerfil(perfilSelecionado);
    setBlocoVisivel(blocos.comuns, true);
    setBlocoVisivel(blocos.perfil, true);
    setGrupoPerfilAtivo(perfilSelecionado);
    setBlocoVisivel(blocos.endereco, true);
    setBlocoVisivel(blocos.acesso, true);
    validarConfirmacaoSenha();
    setBlocoVisivel(blocos.finalizacao, true);
  }

  // esse trecho formata CPF, CNPJ, telefone e CEP enquanto a pessoa digita
  function somenteNumeros(valor) {
    return valor.replace(/\D/g, "");
  }

  function validarEmailEnquantoDigita() {
    if (!emailUsuario || !erroEmailUsuario) return;

    const tinhaEspaco = /\s/.test(emailUsuario.value);
    if (tinhaEspaco) emailUsuario.value = emailUsuario.value.replace(/\s/g, "");

    const email = emailUsuario.value;
    let mensagem = "";

    if (tinhaEspaco) {
      mensagem = "O e-mail não pode conter espaços. Eles foram removidos.";
    } else if (email && !emailUsuario.validity.valid) {
      mensagem = "Informe um e-mail válido.";
    }

    erroEmailUsuario.textContent = mensagem;
    emailUsuario.classList.toggle("campo-invalido", Boolean(mensagem));
    emailUsuario.setAttribute("aria-invalid", String(Boolean(mensagem)));
  }

  function normalizarCNPJ(valor) {
    return valor
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 14);
  }

  function mascaraCPF(valor) {
    return somenteNumeros(valor)
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function mascaraCNPJ(valor) {
    const cnpj = normalizarCNPJ(valor);
    const partes = [
      cnpj.slice(0, 2),
      cnpj.slice(2, 5),
      cnpj.slice(5, 8),
      cnpj.slice(8, 12),
      cnpj.slice(12, 14),
    ];

    return partes
      .filter(Boolean)
      .map((parte, indice) => {
        if (indice === 1 || indice === 2) return `.${parte}`;
        if (indice === 3) return `/${parte}`;
        if (indice === 4) return `-${parte}`;
        return parte;
      })
      .join("");
  }

  function mascaraTelefone(valor) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
      return numeros
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function mascaraCEP(valor) {
    return somenteNumeros(valor)
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function mostrarStatus(mensagem, tipo = "erro") {
    if (!mensagemStatus) return;

    mensagemStatus.textContent = mensagem;
    mensagemStatus.classList.toggle(
      "mensagem-sucesso-cadastro",
      tipo === "sucesso",
    );
    mensagemStatus.classList.toggle(
      "mensagem-carregando-cadastro",
      tipo === "carregando",
    );
  }

  function texto(valor) {
    return typeof valor === "string" ? valor.trim() : "";
  }

  function textoOpcional(valor) {
    return texto(valor) || null;
  }

  function numero(valor) {
    if (texto(valor) === "") return null;

    const valorNumerico = Number(valor);
    return Number.isFinite(valorNumerico) ? valorNumerico : null;
  }

  function criarDadosDoPerfil(dados) {
    switch (dados.perfil) {
      case "BENEFICIARIO":
        return {
          cpf: somenteNumeros(dados.cpf || ""),
          dataNascimento: dados.dataNascimento,
          telefone: somenteNumeros(dados.telefone || ""),
          quantidadePessoasFamilia: numero(dados.quantidadePessoasFamilia),
          rendaFamiliar: numero(dados.rendaFamiliar),
          situacaoVulnerabilidade: texto(dados.situacaoVulnerabilidade),
        };
      case "DOADOR":
        return {
          tipoPessoa: dados.tipoPessoa,
          nomeRazaoSocial: texto(dados.nomeRazaoSocial),
          tipoDocumento: dados.tipoPessoa === "FISICA" ? "CPF" : "CNPJ",
          documento:
            dados.tipoPessoa === "FISICA"
              ? somenteNumeros(dados.documento || "")
              : normalizarCNPJ(dados.documento || ""),
          telefone: somenteNumeros(dados.telefone || ""),
        };
      case "VOLUNTARIO":
        return {
          cpf: somenteNumeros(dados.cpf || ""),
          dataNascimento: dados.dataNascimento,
          telefone: somenteNumeros(dados.telefone || ""),
          possuiTransporte: dados.possuiTransporte === "1",
          disponibilidade: {
            diaSemana: dados.diaSemana,
            periodo: dados.periodo,
            horaInicio: textoOpcional(dados.horaInicio),
            horaFim: textoOpcional(dados.horaFim),
            observacao: textoOpcional(dados.observacaoDisponibilidade),
          },
        };
      case "PONTO_COLETA":
        return {
          nomePonto: texto(dados.nomePonto),
          cnpj: normalizarCNPJ(dados.cnpj || ""),
          telefone: somenteNumeros(dados.telefone || ""),
          capacidadeArmazenamentoKg: numero(dados.capacidadeArmazenamentoKg),
        };
      default:
        throw new Error("Perfil de cadastro inválido.");
    }
  }

  function criarDadosCadastro() {
    const dados = Object.fromEntries(new FormData(form));

    if (!PERFIS_PUBLICOS[dados.perfil]) {
      throw new Error("Perfil de cadastro inválido.");
    }

    const dadosPerfil = criarDadosDoPerfil(dados);
    const cpf =
      dados.perfil === "BENEFICIARIO" || dados.perfil === "VOLUNTARIO"
        ? dadosPerfil.cpf
        : dados.perfil === "DOADOR" && dadosPerfil.tipoDocumento === "CPF"
          ? dadosPerfil.documento
          : undefined;

    return {
      perfil: dados.perfil,
      nome: texto(dados.nome),
      email: texto(dados.email).toLowerCase(),
      senha: dados.senha,
      cpf,
    };
  }

  async function enviarCadastro() {
    const urlApi = form.dataset.apiCadastro;

    if (!urlApi) {
      throw new Error("A URL da API de cadastro não foi configurada.");
    }

    const resposta = await fetch(urlApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criarDadosCadastro()),
    });

    const conteudo = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        conteudo.mensagem ||
          conteudo.message ||
          "Não foi possível concluir o cadastro.",
      );
    }
  }

  perfil.addEventListener("change", () => {
    const perfilSelecionado = perfil.value;
    form.reset();
    perfil.value = perfilSelecionado;
    atualizarFluxo();
  });

  form.addEventListener("input", (evento) => {
    const campo = evento.target;

    if (campo.classList.contains("mascara-cpf")) {
      campo.value = mascaraCPF(campo.value);
    }

    if (campo.classList.contains("mascara-cnpj")) {
      campo.value = mascaraCNPJ(campo.value);
    }

    if (campo.classList.contains("mascara-telefone")) {
      campo.value = mascaraTelefone(campo.value);
    }

    if (campo.classList.contains("mascara-cep")) {
      campo.value = mascaraCEP(campo.value);
    }

    if (campo === documentoDoador) {
      campo.value =
        campo.dataset.tipoDocumento === "CNPJ"
          ? mascaraCNPJ(campo.value)
          : mascaraCPF(campo.value);
    }

    if (campo === senha || campo === confirmacaoSenha) {
      validarConfirmacaoSenha();
    }

    if (campo === emailUsuario) {
      validarEmailEnquantoDigita();
    }

    atualizarFluxo();
  });

  form.addEventListener("change", (evento) => {
    if (evento.target.name === "tipoPessoa") {
      documentoDoador.value = "";
      atualizarCamposCondicionaisDoador();
    }

    if (evento.target === tipoHorarioVoluntario) {
      atualizarCamposCondicionaisVoluntario();
    }

    atualizarFluxo();
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    validarConfirmacaoSenha();
    mostrarStatus("");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const textoOriginalBotao = botaoEnviar?.textContent;

    try {
      if (botaoEnviar) {
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = "Enviando cadastro...";
      }

      mostrarStatus("Enviando seus dados...", "carregando");
      await enviarCadastro();
      mostrarStatus("");

      if (overlayConfirmacao) {
        overlayConfirmacao.classList.add("ativo");
      }
    } catch (erro) {
      mostrarStatus(
        erro.message || "Não foi possível enviar o cadastro. Tente novamente.",
      );
    } finally {
      if (botaoEnviar) {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = textoOriginalBotao || "Criar cadastro";
      }
    }
  });

  botaoConfirmacao?.addEventListener("click", () => {
    window.location.href = form.dataset.redirecionar || "login.html";
  });

  qsa("[data-perfil-opcao]", perfil).forEach((opcao) => {
    const configuracao = PERFIS_PUBLICOS[opcao.dataset.perfilOpcao];
    if (configuracao) opcao.textContent = configuracao.nomeExibicao;
  });

  const perfilPreselecionado = new URLSearchParams(window.location.search).get(
    "perfil",
  );

  if (PERFIS_PUBLICOS[perfilPreselecionado]) {
    perfil.value = perfilPreselecionado;
    if (blocoEscolhaPerfil) blocoEscolhaPerfil.hidden = true;
    if (perfilPreselecionadoResumo) perfilPreselecionadoResumo.hidden = false;
    if (nomePerfilPreselecionado) {
      nomePerfilPreselecionado.textContent =
        PERFIS_PUBLICOS[perfilPreselecionado].nomeExibicao;
    }
  }

  atualizarFluxo();
}
("use strict");

// Esse bloco valida o login; o perfil será definido pela resposta da API.
function iniciarTelaLogin() {
  const formulario = qs(".formulario-login");
  const identificadorInput = qs("#entrada-identificador");
  const senhaInput = qs("#entrada-senha");
  const mensagemErro = qs("#erro-login");

  if (!formulario) return;

  const botaoEntrar = qs(".botao-submit", formulario);
  const modalReativacao = qs("#modal-reativacao");
  const nomeUsuarioInativo = qs("#nome-usuario-inativo");
  const mensagemReativacao = qs("#mensagem-reativacao");
  const botaoCancelarReativacao = qs("#cancelar-reativacao");
  const botaoConfirmarReativacao = qs("#confirmar-reativacao");
  let usuarioInativo = null;

  qsa("[data-perfil-cadastro]").forEach((link) => {
    const perfil = link.dataset.perfilCadastro;
    const configuracao = PERFIS_PUBLICOS[perfil];

    if (!configuracao) return;

    link.href = configuracao.cadastro;
    const nomePerfil = qs("[data-nome-perfil]", link);
    if (nomePerfil) nomePerfil.textContent = configuracao.nomeExibicao;
  });

  const parametrosLogin = new URLSearchParams(window.location.search);

  if (parametrosLogin.get("conta") === "inativa") {
    mostrarErro(
      "Sua conta foi desativada. Entre novamente quando quiser reativá-la.",
      "sucesso",
    );
  } else if (parametrosLogin.get("motivo") === "sessao-expirada") {
    mostrarErro("Sua sessão expirou. Entre novamente para continuar.");
  }

  function mostrarErro(mensagem, tipo = "erro") {
    if (!mensagemErro) return;

    mensagemErro.textContent = mensagem;
    mensagemErro.style.display = mensagem ? "block" : "none";
    mensagemErro.classList.toggle(
      "mensagem-sucesso",
      Boolean(mensagem) && tipo === "sucesso",
    );
    mensagemErro.classList.toggle(
      "mensagem-carregando",
      Boolean(mensagem) && tipo === "carregando",
    );
  }

  function marcarCampoInvalido(campo) {
    if (!campo) return;

    campo.classList.add("campo-invalido");
    campo.setAttribute("aria-invalid", "true");
  }

  function limparCampoInvalido(campo) {
    if (!campo) return;

    campo.classList.remove("campo-invalido");
    campo.removeAttribute("aria-invalid");
  }

  function limparErros() {
    mostrarErro("");
    limparCampoInvalido(identificadorInput);
    limparCampoInvalido(senhaInput);
  }

  function mostrarMensagemReativacao(mensagem, tipo = "erro") {
    if (!mensagemReativacao) return;

    mensagemReativacao.textContent = mensagem;
    mensagemReativacao.classList.toggle(
      "sucesso",
      Boolean(mensagem) && tipo === "sucesso",
    );
  }

  function redirecionarParaDashboard(usuario) {
    if (usuario.perfis?.length > 1) {
      window.location.assign("selecionar_perfil.html");
      return;
    }

    const destino = obterDashboardDoPerfil(usuario.perfil);

    if (!destino) {
      throw new Error(
        "Não foi possível identificar o dashboard do perfil informado.",
      );
    }

    window.location.assign(destino);
  }

  function abrirModalReativacao(usuario) {
    usuarioInativo = usuario;
    if (nomeUsuarioInativo) nomeUsuarioInativo.textContent = usuario.nome;
    mostrarMensagemReativacao("");

    if (modalReativacao) {
      modalReativacao.hidden = false;
      document.body.classList.add("modal-aberto");
      botaoConfirmarReativacao?.focus();
    }
  }

  function fecharModalReativacao() {
    if (modalReativacao) modalReativacao.hidden = true;
    document.body.classList.remove("modal-aberto");
    usuarioInativo = null;
    mostrarMensagemReativacao("");
  }

  function formatarCPF(valor) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatarCNPJ(valor) {
    const cnpj = valor
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 14);
    const partes = [
      cnpj.slice(0, 2),
      cnpj.slice(2, 5),
      cnpj.slice(5, 8),
      cnpj.slice(8, 12),
      cnpj.slice(12, 14),
    ];
    return partes
      .filter(Boolean)
      .map((parte, indice) => {
        if (indice === 1 || indice === 2) return `.${parte}`;
        if (indice === 3) return `/${parte}`;
        if (indice === 4) return `-${parte}`;
        return parte;
      })
      .join("");
  }

  function cpfEhValido(cpf) {
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

    const calcularDigito = (base) => {
      const soma = [...base].reduce(
        (total, digito, indice) =>
          total + Number(digito) * (base.length + 1 - indice),
        0,
      );
      const resultado = (soma * 10) % 11;
      return resultado === 10 ? 0 : resultado;
    };

    return (
      calcularDigito(cpf.slice(0, 9)) === Number(cpf[9]) &&
      calcularDigito(cpf.slice(0, 10)) === Number(cpf[10])
    );
  }

  function normalizarIdentificador(valor) {
    const texto = valor.trim();

    if (texto.includes("@")) {
      return { tipo: "EMAIL", valor: texto.toLowerCase() };
    }

    const documento = texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return {
      tipo: documento.length === 11 && /^\d+$/.test(documento) ? "CPF" : "CNPJ",
      valor: documento,
    };
  }

  function validarFormulario() {
    limparErros();

    const identificador = normalizarIdentificador(
      identificadorInput?.value || "",
    );
    const senha = senhaInput ? senhaInput.value : "";

    if (!identificador.valor) {
      marcarCampoInvalido(identificadorInput);
      mostrarErro("Informe seu e-mail ou CPF.");
      identificadorInput?.focus();
      return null;
    }

    if (
      (identificador.tipo === "EMAIL" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador.valor)) ||
      (identificador.tipo === "CPF" && !cpfEhValido(identificador.valor)) ||
      (identificador.tipo === "CNPJ" &&
        !/^[A-Z0-9]{12}\d{2}$/.test(identificador.valor))
    ) {
      marcarCampoInvalido(identificadorInput);
      mostrarErro(
        identificador.tipo === "EMAIL"
          ? "Informe um e-mail válido."
          : identificador.tipo === "CPF"
            ? "Informe um CPF válido."
            : "Informe um CNPJ válido.",
      );
      identificadorInput?.focus();
      return null;
    }

    if (!senha) {
      marcarCampoInvalido(senhaInput);
      mostrarErro("Informe sua senha.");
      senhaInput?.focus();
      return null;
    }

    return { identificador: identificador.valor, senha };
  }

  async function enviarLogin(dadosLogin) {
    const urlApi = formulario.dataset.apiLogin;

    if (!urlApi) {
      throw new Error("A URL da API de login não foi configurada.");
    }

    const resposta = await fetch(urlApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login: dadosLogin.identificador,
        senha: dadosLogin.senha,
      }),
    });
    const conteudo = await resposta.json().catch(() => ({}));

    if (resposta.status === 409 && conteudo.codigo === "CONTA_INATIVA") {
      return {
        situacao: "INATIVA",
        usuario: obterUsuarioDaRespostaApi(conteudo),
      };
    }

    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error("E-mail/CPF ou senha incorretos.");
    }

    if (!resposta.ok) {
      throw new Error(
        conteudo.mensagem ||
          conteudo.message ||
          "Não foi possível entrar agora.",
      );
    }

    if (typeof conteudo.access_token !== "string" || !conteudo.access_token) {
      throw new Error("A resposta da API não contém um token de acesso.");
    }

    sessionStorage.setItem("access_token", conteudo.access_token);

    return {
      situacao: "ATIVA",
      usuario: obterUsuarioDaRespostaApi(conteudo),
    };
  }

  async function reativarConta() {
    const urlApi = formulario.dataset.apiReativar;

    if (!urlApi) {
      throw new Error("A URL da API de reativação não foi configurada.");
    }

    const resposta = await fetch(urlApi, {
      method: "POST",
      credentials: "include",
    });
    const conteudo = await resposta.json().catch(() => ({}));

    if (resposta.status === 401 || resposta.status === 403) {
      throw new Error(
        "A confirmação expirou. Entre novamente para reativar sua conta.",
      );
    }

    if (!resposta.ok) {
      throw new Error(
        conteudo.mensagem ||
          conteudo.message ||
          "Não foi possível reativar sua conta.",
      );
    }

    return obterUsuarioDaRespostaApi(conteudo);
  }

  formulario.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    const dadosLogin = validarFormulario();
    if (!dadosLogin) return;

    const textoOriginal = botaoEntrar?.textContent;

    try {
      if (botaoEntrar) {
        botaoEntrar.disabled = true;
        botaoEntrar.setAttribute("aria-busy", "true");
        botaoEntrar.textContent = "Entrando...";
      }

      mostrarErro("Validando seus dados...", "carregando");
      const resultado = await enviarLogin(dadosLogin);

      if (resultado.situacao === "INATIVA") {
        senhaInput.value = "";
        mostrarErro("");
        abrirModalReativacao(resultado.usuario);
        return;
      }

      redirecionarParaDashboard(resultado.usuario);
    } catch (erro) {
      const mensagem =
        erro instanceof TypeError
          ? "Não foi possível conectar ao serviço de login. Tente novamente mais tarde."
          : erro.message || "Não foi possível entrar agora.";
      mostrarErro(mensagem);
    } finally {
      if (botaoEntrar) {
        botaoEntrar.disabled = false;
        botaoEntrar.removeAttribute("aria-busy");
        botaoEntrar.textContent = textoOriginal || "Entrar";
      }
    }
  });

  botaoCancelarReativacao?.addEventListener("click", () => {
    fecharModalReativacao();
    mostrarErro("Sua conta continua inativa.");
  });

  botaoConfirmarReativacao?.addEventListener("click", async () => {
    if (!usuarioInativo) return;

    const textoOriginal = botaoConfirmarReativacao.textContent;

    try {
      botaoConfirmarReativacao.disabled = true;
      botaoConfirmarReativacao.setAttribute("aria-busy", "true");
      botaoConfirmarReativacao.textContent = "Reativando...";
      mostrarMensagemReativacao("Reativando sua conta...", "sucesso");

      const usuario = await reativarConta();
      redirecionarParaDashboard(usuario);
    } catch (erro) {
      const mensagem =
        erro instanceof TypeError
          ? "Não foi possível conectar ao serviço de reativação. Tente novamente mais tarde."
          : erro.message || "Não foi possível reativar sua conta.";
      mostrarMensagemReativacao(mensagem);
    } finally {
      botaoConfirmarReativacao.disabled = false;
      botaoConfirmarReativacao.removeAttribute("aria-busy");
      botaoConfirmarReativacao.textContent = textoOriginal || "Reativar conta";
    }
  });

  [identificadorInput, senhaInput].forEach((campo) => {
    campo?.addEventListener("input", function () {
      const eEmail = campo === identificadorInput && campo.value.includes("@");
      const tinhaEspacoNoIdentificador =
        campo === identificadorInput && /\s/.test(campo.value);

      if (tinhaEspacoNoIdentificador) {
        campo.value = campo.value.replace(/\s/g, "");
        marcarCampoInvalido(campo);
        mostrarErro(
          "E-mail, CPF ou CNPJ não pode conter espaços. Eles foram removidos.",
        );
        return;
      }

      if (
        eEmail &&
        campo.value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campo.value)
      ) {
        marcarCampoInvalido(campo);
        mostrarErro("Informe um e-mail válido.");
        return;
      }

      if (
        campo === identificadorInput &&
        !campo.value.includes("@") &&
        /^\d+$/.test(campo.value.replace(/\D/g, ""))
      ) {
        const documento = campo.value.replace(/[^A-Za-z0-9]/g, "");
        campo.value = /^\d{0,11}$/.test(documento)
          ? formatarCPF(documento)
          : formatarCNPJ(documento);
      }

      limparCampoInvalido(campo);
      mostrarErro("");
    });
  });
}

// Este bloco permite desativar a própria conta sem remover seus dados.
function iniciarDesativacaoConta() {
  const botaoDesativar = qs("[data-desativar-conta]");
  if (!botaoDesativar) return;

  const modal = document.createElement("div");
  modal.className = "modal-desativacao";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-desativacao-caixa" role="dialog" aria-modal="true" aria-labelledby="titulo-desativacao">
      <h2 id="titulo-desativacao">Desativar conta?</h2>
      <p>Sua conta ficará inativa e seus dados serão preservados. Você poderá reativá-la ao fazer login novamente.</p>
      <p class="mensagem-desativacao" role="status" aria-live="polite"></p>
      <div class="acoes-desativacao">
        <button type="button" class="botao-cancelar-desativacao">Cancelar</button>
        <button type="button" class="botao-confirmar-desativacao">Desativar conta</button>
      </div>
    </div>
  `;
  document.body.append(modal);

  const botaoCancelar = qs(".botao-cancelar-desativacao", modal);
  const botaoConfirmar = qs(".botao-confirmar-desativacao", modal);
  const mensagem = qs(".mensagem-desativacao", modal);

  function mostrarMensagem(mensagemTexto = "") {
    if (mensagem) mensagem.textContent = mensagemTexto;
  }

  function fecharModal() {
    modal.hidden = true;
    mostrarMensagem("");
  }

  botaoDesativar.addEventListener("click", () => {
    modal.hidden = false;
    botaoConfirmar?.focus();
  });

  botaoCancelar?.addEventListener("click", fecharModal);

  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) fecharModal();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !modal.hidden) fecharModal();
  });

  botaoConfirmar?.addEventListener("click", async () => {
    const textoOriginal = botaoConfirmar.textContent;

    try {
      botaoConfirmar.disabled = true;
      botaoConfirmar.setAttribute("aria-busy", "true");
      botaoConfirmar.textContent = "Desativando...";
      mostrarMensagem("Desativando sua conta...");

      const resposta = await fetch("/api/usuarios/me/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INATIVA" }),
        credentials: "include",
      });
      const conteudo = await resposta.json().catch(() => ({}));

      if (resposta.status === 401 || resposta.status === 403) {
        throw new Error(
          "Sua sessão expirou. Entre novamente para desativar a conta.",
        );
      }

      if (!resposta.ok) {
        throw new Error(
          conteudo.mensagem ||
            conteudo.message ||
            "Não foi possível desativar sua conta.",
        );
      }

      window.location.assign("login.html?conta=inativa");
    } catch (erro) {
      const mensagemErro =
        erro instanceof TypeError
          ? "Não foi possível conectar ao serviço. Tente novamente mais tarde."
          : erro.message || "Não foi possível desativar sua conta.";
      mostrarMensagem(mensagemErro);
    } finally {
      botaoConfirmar.disabled = false;
      botaoConfirmar.removeAttribute("aria-busy");
      botaoConfirmar.textContent = textoOriginal || "Desativar conta";
    }
  });
}

// Este bloco libera cada dashboard apenas para uma sessão e um perfil compatíveis.
async function iniciarProtecaoDashboard() {
  const perfilEsperado = document.body.dataset.dashboard;
  const protecaoAtiva = document.body.dataset.autenticacaoAtiva === "true";

  if (!perfilEsperado || !protecaoAtiva) return true;

  const telaVerificacao = document.createElement("div");
  telaVerificacao.className = "tela-verificacao-sessao";
  telaVerificacao.innerHTML = `
    <div class="verificacao-sessao-conteudo">
      <p id="mensagem-verificacao-sessao">Verificando sua sessão...</p>
    </div>
  `;
  document.body.append(telaVerificacao);

  const mensagem = qs("#mensagem-verificacao-sessao", telaVerificacao);

  function redirecionarParaLogin(motivo) {
    window.location.replace(`login.html?motivo=${encodeURIComponent(motivo)}`);
  }

  function mostrarErroDeVerificacao() {
    if (!mensagem) return;

    mensagem.textContent =
      "Não foi possível verificar sua sessão. Tente novamente.";
    const botaoTentarNovamente = document.createElement("button");
    botaoTentarNovamente.type = "button";
    botaoTentarNovamente.textContent = "Tentar novamente";
    botaoTentarNovamente.addEventListener("click", () =>
      window.location.reload(),
    );
    mensagem.after(botaoTentarNovamente);
  }

  const token = sessionStorage.getItem("access_token");

  console.log(token)

  if (!token) {
    redirecionarParaLogin("sessao-expirada");
    return false;
  }

  try {
    const resposta = await fetch(
      "http://localhost:3000/auth/login",
      {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      },
    );

    if (resposta.status === 401 || resposta.status === 403) {
      sessionStorage.clear();
      redirecionarParaLogin("sessao-expirada");
      return false;
    }

    if (!resposta.ok) {
      mostrarErroDeVerificacao();
      return false;
    }

    const usuario = obterUsuarioDaRespostaApi(await resposta.json());
    
    usuarioLogado = usuario;

    console.log(usuarioLogado)
    const destino = obterDashboardDoPerfil(usuario.perfil);

    

    if (usuario.perfil !== perfilEsperado) {
      window.location.replace(destino);
      return false;
    }

    document.body.classList.add("autenticacao-verificada");
    telaVerificacao.remove();
    return true;
  } catch (erro) {
    mostrarErroDeVerificacao();
    return false;
  }
}

// esse bloco inicia somente as funções necessárias para a página aberta
async function logout() {
  const token = sessionStorage.getItem("access_token");

  try {
    if (token) {
      await fetch(
        "http://localhost:3000/auth/logout",
        {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        },
      );
    }
  } catch (erro) {
    console.warn("Não foi possível encerrar a sessão no servidor.", erro);
  } finally {
    sessionStorage.clear();
    window.location.replace("login.html");
  }
}

function iniciarLogout() {
  qsa(".botao-sair-nav").forEach((botao) => {
    botao.addEventListener("click", async (evento) => {
      evento.preventDefault();
      await logout();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const acessoLiberado = await iniciarProtecaoDashboard();
  if (!acessoLiberado) return;

  iniciarNavbar();
  iniciarSmoothScroll();

  iniciarPaginaInicio();
  iniciarPaginaSobre();
  iniciarPaginaFaq();
  iniciarPaginaImpacto();
  iniciarPaginaFamilia();
  iniciarPaginaComoFunciona();
  iniciarPaginaVoluntario();
  iniciarPaginaDoador();
  iniciarPaginaEmpresa();
  iniciarPaginaContato();
  iniciarPaginaCadastro();
  iniciarTelaLogin();
  iniciarSelecaoPerfil();
  iniciarDashboardBeneficiario();
  iniciarDashboardDoador();
  iniciarDashboardPonto();
  iniciarDashboardVoluntario();
  iniciarDashboardAdministrador();
  iniciarAtalhoTrocaPerfil();
  iniciarDesativacaoConta();
  iniciarLogout();
  aplicarUsuarioLogadoNaTela();
});

function iniciarAtalhoTrocaPerfil() {
  if (!document.body.dataset.dashboard || usuarioLogado?.perfis?.length < 2)
    return;

  const menu = qs(".menu-perfil");
  if (!menu || qs("[data-trocar-perfil]", menu)) return;

  const atalho = document.createElement("a");
  atalho.href = "selecionar_perfil.html";
  atalho.className = "item-menu-perfil";
  atalho.dataset.trocarPerfil = "";
  atalho.textContent = "🔄 Trocar perfil";
  menu.append(atalho);
}

// Permite que uma conta com mais de um perfil escolha sua área de atuação.
function iniciarSelecaoPerfil() {
  const lista = qs("#lista-perfis-disponiveis");
  if (!lista) return;

  const mensagem = qs("#mensagem-selecao-perfil");
  const urlPerfilAtivo = lista.dataset.apiPerfilAtivo;

  function mostrarMensagem(texto, erro = false) {
    if (!mensagem) return;
    mensagem.textContent = texto;
    mensagem.classList.toggle("mensagem-erro", erro);
  }

  function renderizarPerfis(usuario) {
    lista.innerHTML = "";

    usuario.perfis.forEach((perfil) => {
      const configuracao = PERFIS_SISTEMA[perfil];
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "cartao-perfil botao-perfil-disponivel";
      botao.innerHTML = `<span>${configuracao.nomeExibicao}</span><small>Acessar painel →</small>`;
      botao.addEventListener("click", async () => {
        const textoOriginal = botao.textContent;
        botao.disabled = true;
        botao.textContent = "Abrindo painel...";
        mostrarMensagem("Definindo o perfil ativo...");

        try {
          const resposta = await fetch(urlPerfilAtivo, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ perfil }),
            credentials: "include",
          });

          if (!resposta.ok)
            throw new Error("Não foi possível trocar o perfil agora.");
          window.location.assign(configuracao.dashboard);
        } catch (erro) {
          mostrarMensagem(
            erro instanceof TypeError
              ? "Não foi possível conectar ao serviço. Tente novamente."
              : erro.message,
            true,
          );
          botao.disabled = false;
          botao.textContent = textoOriginal;
        }
      });
      lista.append(botao);
    });
  }

  (async () => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
      window.location.replace("login.html?motivo=sessao-expirada");
      return;
    }

    try {
      const resposta = await fetch(
        "http://localhost:3000/auth/me",
        {
      
        headers: {
          Authorization: `Bearer ${token}`,
        },
        },
      );
      if (resposta.status === 401 || resposta.status === 403) {
        sessionStorage.clear();
        window.location.replace("login.html?motivo=sessao-expirada");
        return;
      }
      if (!resposta.ok)
        throw new Error("Não foi possível carregar os seus perfis.");

      const usuario = obterUsuarioDaRespostaApi(await resposta.json());
      if (usuario.perfis.length === 1) {
        window.location.replace(obterDashboardDoPerfil(usuario.perfil));
        return;
      }
      renderizarPerfis(usuario);
      mostrarMensagem("Escolha o perfil que deseja acessar.");
    } catch (erro) {
      mostrarMensagem(
        erro instanceof TypeError
          ? "Não foi possível conectar ao serviço. Tente novamente."
          : erro.message,
        true,
      );
    }
  })();
}

// Painel visual do administrador. Os dados serão preenchidos pela API quando
// o backend estiver disponível; por enquanto os filtros organizam a prévia.
function iniciarDashboardAdministrador() {
  if (document.body.dataset.dashboard !== "ADMINISTRADOR") return;

  const filtro = qs("#filtro-admin-usuarios");
  const linhas = qsa("[data-usuario-admin]");
  const semResultados = qs("#admin-sem-resultados");

  filtro?.addEventListener("input", () => {
    const termo = filtro.value.trim().toLocaleLowerCase("pt-BR");
    let encontrados = 0;

    linhas.forEach((linha) => {
      const corresponde = linha.textContent
        .toLocaleLowerCase("pt-BR")
        .includes(termo);
      linha.hidden = !corresponde;
      if (corresponde) encontrados++;
    });

    if (semResultados) semResultados.hidden = encontrados !== 0;
  });
}

// esse bloco controla o mapa, as solicitações e o perfil do beneficiário
function iniciarDashboardBeneficiario() {
  const mapaDashboard = document.getElementById("mapa-pontos-coleta");

  if (!mapaDashboard) return;

  if (typeof L === "undefined") {
    console.error(
      "Não foi possível carregar o mapa: a biblioteca Leaflet não está disponível.",
    );
    return;
  }

  // esse trecho mostra mensagens rápidas e confirmações na tela
  function mostrarToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("visivel");
    setTimeout(() => toast.classList.remove("visivel"), 3500);
  }

  function abrirModal({ icone, titulo, texto, corBotao, onConfirmar }) {
    document.getElementById("modal-icone").textContent = icone;
    document.getElementById("modal-titulo").textContent = titulo;
    document.getElementById("modal-texto").textContent = texto;
    const btnConfirmar = document.getElementById("modal-confirmar");
    btnConfirmar.className = `btn-modal-confirmar ${corBotao}`;
    document.getElementById("modal-overlay").classList.add("aberto");

    btnConfirmar.onclick = () => {
      document.getElementById("modal-overlay").classList.remove("aberto");
      onConfirmar();
    };
  }

  document.getElementById("modal-cancelar").onclick = () =>
    document.getElementById("modal-overlay").classList.remove("aberto");

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay"))
      document.getElementById("modal-overlay").classList.remove("aberto");
  });

  // esse trecho monta o mapa e coloca os pontos de coleta
  const mapa = L.map("mapa-pontos-coleta", { gestureHandling: true }).setView(
    [-23.55, -46.63],
    13,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapa);

  const pontosColeta = [
    {
      nome: "Ponto Centro",
      lat: -23.548,
      lng: -46.636,
      disponivel: true,
      itens: "Cesta básica, Higiene",
    },
    {
      nome: "Ponto Norte",
      lat: -23.53,
      lng: -46.625,
      disponivel: true,
      itens: "Cesta básica, Roupas",
    },
    {
      nome: "Ponto Sul",
      lat: -23.572,
      lng: -46.645,
      disponivel: false,
      itens: "Sem itens no momento",
    },
    {
      nome: "Ponto Leste",
      lat: -23.555,
      lng: -46.61,
      disponivel: true,
      itens: "Cesta básica",
    },
    {
      nome: "Ponto Oeste",
      lat: -23.545,
      lng: -46.66,
      disponivel: false,
      itens: "Sem itens no momento",
    },
    {
      nome: "Ponto Bom Retiro",
      lat: -23.535,
      lng: -46.642,
      disponivel: true,
      itens: "Cesta básica, Brinquedos",
    },
    {
      nome: "Ponto Brás",
      lat: -23.543,
      lng: -46.617,
      disponivel: true,
      itens: "Roupas, Calçados",
    },
    {
      nome: "Ponto Ipiranga",
      lat: -23.568,
      lng: -46.62,
      disponivel: false,
      itens: "Sem itens no momento",
    },
    {
      nome: "Ponto Tatuapé",
      lat: -23.548,
      lng: -46.593,
      disponivel: true,
      itens: "Cesta básica, Higiene, Roupas",
    },
    {
      nome: "Ponto Pinheiros",
      lat: -23.563,
      lng: -46.677,
      disponivel: true,
      itens: "Cesta básica",
    },
    {
      nome: "Ponto Santana",
      lat: -23.512,
      lng: -46.628,
      disponivel: true,
      itens: "Cesta básica, Móveis",
    },
    {
      nome: "Ponto Santo André",
      lat: -23.59,
      lng: -46.538,
      disponivel: false,
      itens: "Sem itens no momento",
    },
    {
      nome: "Ponto Guarulhos",
      lat: -23.473,
      lng: -46.533,
      disponivel: true,
      itens: "Cesta básica, Higiene",
    },
    {
      nome: "Ponto Osasco",
      lat: -23.532,
      lng: -46.792,
      disponivel: true,
      itens: "Roupas, Calçados, Higiene",
    },
    {
      nome: "Ponto São Bernardo",
      lat: -23.694,
      lng: -46.565,
      disponivel: false,
      itens: "Sem itens no momento",
    },
  ];

  pontosColeta.forEach((ponto) => {
    const cor = ponto.disponivel ? "#2e8b57" : "#e53935";
    const icone = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${cor};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    const botoesPopup = ponto.disponivel
      ? `<button class="btn-popup btn-popup-caminho" onclick="confirmarCaminho('${ponto.nome}')">🚶 Estou a caminho para retirar</button>
             <button class="btn-popup btn-popup-entrega" onclick="confirmarEntrega('${ponto.nome}')">🏠 Preciso de entrega em casa</button>`
      : `<button class="btn-popup btn-popup-notificar" onclick="confirmarNotificar('${ponto.nome}')">🔔 Me avisar quando tiver itens</button>`;

    L.marker([ponto.lat, ponto.lng], { icon: icone }).addTo(mapa).bindPopup(`
          <strong>${ponto.nome}</strong><br/>
          <span style="color:${cor};font-weight:600;">${ponto.disponivel ? "✔ Itens disponíveis" : "✘ Sem itens"}</span><br/>
          <small>${ponto.itens}</small>
          <div class="popup-acoes">${botoesPopup}</div>
        `);
  });

  window.confirmarCaminho = (nomePonto) => {
    abrirModal({
      icone: "🚶",
      titulo: "Confirmar deslocamento",
      texto: `Deseja notificar o "${nomePonto}" que você está a caminho para retirar um kit de doação disponível?`,
      corBotao: "verde",
      onConfirmar: () =>
        mostrarToast(
          `✅ Ponto "${nomePonto}" notificado! Eles vão te aguardar.`,
        ),
    });
  };

  window.confirmarEntrega = (nomePonto) => {
    abrirModal({
      icone: "🏠",
      titulo: "Solicitar entrega por voluntário",
      texto:
        "Deseja notificar os voluntários que sua família precisa de doação de alimentos e não possui condições de retirar por conta própria?",
      corBotao: "azul",
      onConfirmar: () =>
        mostrarToast(
          "📣 Voluntários notificados! Em breve alguém entrará em contato.",
        ),
    });
  };

  // esse trecho cria e mostra as notificações do beneficiário
  let contadorNotif = 0;

  function adicionarNotificacao(icone, titulo, detalhe) {
    contadorNotif++;
    const badge = document.getElementById("badge-sino");
    badge.textContent = contadorNotif;
    badge.classList.add("visivel");

    const semNotif = document.getElementById("sem-notificacoes");
    if (semNotif) semNotif.remove();

    const lista = document.getElementById("lista-notificacoes");
    const item = document.createElement("div");
    item.className = "item-notificacao";
    item.innerHTML = `
          <span class="notif-icone">${icone}</span>
          <div class="notif-texto">
            <strong>${titulo}</strong>
            <span>${detalhe}</span>
          </div>`;
    lista.prepend(item);
  }

  window.confirmarNotificar = (nomePonto) => {
    abrirModal({
      icone: "🔔",
      titulo: "Ativar notificação",
      texto: `Deseja ser notificado quando o "${nomePonto}" receber novos itens de doação disponíveis?`,
      corBotao: "azul",
      onConfirmar: () => {
        mostrarToast(`🔔 Você será avisado quando o ${nomePonto} tiver itens!`);
        setTimeout(() => {
          adicionarNotificacao(
            "📦",
            `${nomePonto} — Itens disponíveis!`,
            "Novos itens chegaram. Clique para ver.",
          );
          mostrarToast(`📦 ${nomePonto} agora tem itens disponíveis!`);
        }, 6000);
      },
    });
  };

  document.getElementById("sino").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("painel-notificacoes").classList.toggle("aberto");
  });

  document.addEventListener("click", () =>
    document.getElementById("painel-notificacoes").classList.remove("aberto"),
  );

  // esse trecho abre o perfil e permite editar os dados
  const gaveta = document.getElementById("gaveta-perfil");
  const gavOv = document.getElementById("gaveta-overlay");
  const acoesEd = document.getElementById("gaveta-acoes-edicao");
  const btnEditar = document.getElementById("gaveta-btn-editar");

  const camposEditaveis = [
    "gv-nome",
    "gv-telefone",
    "gv-rua",
    "gv-bairro",
    "gv-cidade",
    "gv-cep",
    "gv-responsavel",
    "gv-membros",
  ];
  let valoresOriginais = {};

  function sincronizarNome(nomeCompleto) {
    const primeiroNome = nomeCompleto.split(" ")[0];
    const inicial = nomeCompleto.charAt(0).toUpperCase();
    document.getElementById("gaveta-nome-exibido").textContent = nomeCompleto;
    document.getElementById("gaveta-avatar").textContent = inicial;
    document.getElementById("avatar-inicial").textContent = inicial;
    document.getElementById("avatar-chip").textContent = inicial;
    document.getElementById("titulo-boas-vindas").textContent =
      `Olá, ${primeiroNome}!`;
    document.getElementById("nome-chip").textContent = primeiroNome;
  }

  sincronizarNome(document.getElementById("gv-nome").value);

  function abrirGaveta() {
    gaveta.classList.add("aberta");
    gavOv.classList.add("aberta");
    document.body.style.overflow = "hidden";
  }

  function fecharGaveta() {
    gaveta.classList.remove("aberta");
    gavOv.classList.remove("aberta");
    document.body.style.overflow = "";
    sairModoEdicao(false);
  }

  function entrarModoEdicao() {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      valoresOriginais[id] = inp.value;
      inp.disabled = false;
    });
    btnEditar.style.display = "none";
    acoesEd.classList.add("visivel");
    document.getElementById("gv-nome").focus();
  }

  function sairModoEdicao(salvar) {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      if (!salvar) inp.value = valoresOriginais[id] ?? inp.value;
      inp.disabled = true;
    });
    btnEditar.style.display = "";
    acoesEd.classList.remove("visivel");
  }

  document.getElementById("btn-abrir-perfil").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta();
  });

  // esse trecho abre e controla as solicitações de ajuda
  const gavetaSolic = document.getElementById("gaveta-solicitacoes");

  function abrirGavetaSolic() {
    gavetaSolic.classList.add("aberta");
    gavOv.classList.add("aberta");
    document.body.style.overflow = "hidden";
  }

  function fecharGavetaSolic() {
    gavetaSolic.classList.remove("aberta");
    gavOv.classList.remove("aberta");
    document.body.style.overflow = "";
  }

  const modalForm = document.getElementById("modal-form-overlay");

  function abrirModalForm() {
    const hoje = new Date().toISOString().split("T")[0];
    document.getElementById("form-data").min = hoje;
    atualizarCampoPonto();
    modalForm.classList.add("aberto");
    document.body.style.overflow = "hidden";
  }

  function atualizarCampoPonto() {
    const selecionado = document.querySelector(
      'input[name="modalidade"]:checked',
    );
    const grupoPonto = document.getElementById("grupo-ponto");
    const selectPonto = document.getElementById("form-ponto");
    if (!selecionado || selecionado.value === "entrega") {
      grupoPonto.style.display = "none";
      selectPonto.value = "";
    } else {
      grupoPonto.style.display = "";
    }
  }

  document
    .querySelectorAll('input[name="modalidade"]')
    .forEach((r) => r.addEventListener("change", atualizarCampoPonto));

  function limparModalForm() {
    document
      .querySelectorAll('input[name="itens"]')
      .forEach((cb) => (cb.checked = false));
    document
      .querySelectorAll('input[name="modalidade"]')
      .forEach((r) => (r.checked = false));
    document.getElementById("form-ponto").value = "";
    document.getElementById("form-data").value = "";
    document.getElementById("form-obs").value = "";
    atualizarCampoPonto();
  }

  function fecharModalForm() {
    modalForm.classList.remove("aberto");
    document.body.style.overflow = "";
    limparModalForm();
  }

  function tentarFecharModalForm() {
    abrirModal({
      icone: "⚠️",
      titulo: "Sair sem enviar?",
      texto:
        "Você tem alterações não enviadas. Se sair agora, elas serão descartadas.",
      corBotao: "azul",
      onConfirmar: fecharModalForm,
    });
  }

  document
    .getElementById("btn-abrir-form-solicitacao")
    .addEventListener("click", abrirModalForm);
  document
    .getElementById("modal-form-fechar")
    .addEventListener("click", tentarFecharModalForm);
  document
    .getElementById("modal-form-cancelar")
    .addEventListener("click", tentarFecharModalForm);
  modalForm.addEventListener("click", (e) => {
    if (e.target === modalForm) tentarFecharModalForm();
  });

  document.getElementById("modal-form-enviar").addEventListener("click", () => {
    const modalidade = document.querySelector(
      'input[name="modalidade"]:checked',
    ).value;
    const ponto = document.getElementById("form-ponto").value;
    const itens = [
      ...document.querySelectorAll('input[name="itens"]:checked'),
    ].map((el) => el.parentElement.textContent.trim());

    if (!itens.length) {
      mostrarToast("⚠️ Selecione ao menos um item.");
      return;
    }
    if (modalidade === "retirada" && !ponto) {
      mostrarToast("⚠️ Selecione um ponto de coleta.");
      return;
    }

    fecharModalForm();
    mostrarToast("✅ Solicitação enviada com sucesso!");
  });

  document
    .getElementById("btn-nova-solicitacao")
    .addEventListener("click", () => {
      fecharGavetaSolic();
      abrirModalForm();
    });

  document
    .getElementById("btn-abrir-solicitacoes")
    .addEventListener("click", (e) => {
      e.preventDefault();
      abrirGavetaSolic();
    });

  document
    .getElementById("gaveta-solicitacoes-fechar")
    .addEventListener("click", fecharGavetaSolic);

  document
    .getElementById("btn-nova-solicitacao")
    .addEventListener("click", () => {
      fecharGavetaSolic();
      mostrarToast("📋 Funcionalidade em breve disponível!");
    });

  document
    .getElementById("gaveta-fechar")
    .addEventListener("click", fecharGaveta);
  gavOv.addEventListener("click", () => {
    if (gaveta.classList.contains("aberta")) fecharGaveta();
    else if (gavetaSolic.classList.contains("aberta")) fecharGavetaSolic();
    else fecharGavetaAjuda();
  });

  // esse trecho abre o atendimento e envia a mensagem de ajuda
  const gavetaAjuda = document.getElementById("gaveta-ajuda");

  function abrirGavetaAjuda() {
    gavetaAjuda.classList.add("aberta");
    gavOv.classList.add("aberta");
    document.body.style.overflow = "hidden";
  }

  function fecharGavetaAjuda() {
    gavetaAjuda.classList.remove("aberta");
    gavOv.classList.remove("aberta");
    document.body.style.overflow = "";
  }

  document.getElementById("btn-abrir-ajuda").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGavetaAjuda();
  });

  document
    .getElementById("gaveta-ajuda-fechar")
    .addEventListener("click", fecharGavetaAjuda);
  document
    .getElementById("gaveta-ajuda-cancelar")
    .addEventListener("click", fecharGavetaAjuda);

  document
    .getElementById("gaveta-ajuda-enviar")
    .addEventListener("click", () => {
      const assunto = document.getElementById("sac-assunto").value;
      const mensagem = document.getElementById("sac-mensagem").value.trim();

      if (!assunto) {
        mostrarToast("⚠️ Selecione um assunto.");
        return;
      }
      if (!mensagem) {
        mostrarToast("⚠️ Escreva sua mensagem.");
        return;
      }

      document.getElementById("sac-assunto").value = "";
      document.getElementById("sac-mensagem").value = "";
      fecharGavetaAjuda();
      mostrarToast("✅ Mensagem enviada! Retornaremos em até 2 dias úteis.");
    });
  btnEditar.addEventListener("click", entrarModoEdicao);

  document
    .getElementById("gaveta-btn-cancelar")
    .addEventListener("click", () => sairModoEdicao(false));

  document.getElementById("gaveta-btn-salvar").addEventListener("click", () => {
    sairModoEdicao(true);
    const novoNome = document.getElementById("gv-nome").value.trim();
    if (novoNome) sincronizarNome(novoNome);
    mostrarToast("✅ Perfil atualizado com sucesso!");
  });
}

// esse bloco controla as doações, notificações e o perfil do doador
function iniciarDashboardDoador() {
  if (!document.getElementById("contador-pendentes-doador")) return;

  // esse trecho mostra mensagens e confirma as ações do doador
  function mostrarToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("visivel");
    setTimeout(() => t.classList.remove("visivel"), 3500);
  }

  function abrirModal({ icone, titulo, texto, corBotao, onConfirmar }) {
    document.getElementById("modal-icone").textContent = icone;
    document.getElementById("modal-titulo").textContent = titulo;
    document.getElementById("modal-texto").textContent = texto;
    const btn = document.getElementById("modal-confirmar");
    btn.className = `btn-modal-confirmar ${corBotao}`;
    document.getElementById("modal-overlay").classList.add("aberto");
    btn.onclick = () => {
      document.getElementById("modal-overlay").classList.remove("aberto");
      onConfirmar();
    };
  }

  document.getElementById("modal-cancelar").onclick = () =>
    document.getElementById("modal-overlay").classList.remove("aberto");

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay"))
      document.getElementById("modal-overlay").classList.remove("aberto");
  });

  // esse trecho guarda os pontos, itens e doações usados no painel
  const pontosDisponiveis = [
    {
      id: "centro",
      nome: "Ponto Centro",
      endereco: "Rua das Flores, 100 — Centro · Seg–Sáb 09h–17h",
      necessidades: ["Higiene", "Brinquedos"],
    },
    {
      id: "norte",
      nome: "Ponto Norte",
      endereco: "Av. Norte, 450 — Santana · Seg–Sex 08h–16h",
      necessidades: ["Cesta básica"],
    },
    {
      id: "sul",
      nome: "Ponto Sul",
      endereco: "Rua do Sul, 88 — Santo André · Ter–Sáb 10h–18h",
      necessidades: ["Cesta básica", "Brinquedos", "Roupas e calçados"],
    },
    {
      id: "leste",
      nome: "Ponto Leste",
      endereco: "Av. Celso Garcia, 200 — Belém · Seg–Sex 09h–17h",
      necessidades: [],
    },
  ];

  const catalogoItens = [
    { id: "cesta", icone: "🛒", nome: "Cesta básica", unidade: "cestas" },
    { id: "higiene", icone: "🧴", nome: "Higiene", unidade: "kits" },
    { id: "roupas", icone: "👕", nome: "Roupas e calçados", unidade: "peças" },
    { id: "brinquedos", icone: "🧸", nome: "Brinquedos", unidade: "itens" },
  ];

  let minhasDoacoes = [
    {
      id: 1,
      ponto: "Ponto Centro",
      itens: [
        { nome: "Cesta básica", qtd: 3 },
        { nome: "Higiene", qtd: 2 },
      ],
      data: "10/04/2026",
      dataReceb: "11/04/2026",
      obs: "",
      status: "recebida",
    },
    {
      id: 2,
      ponto: "Ponto Norte",
      itens: [{ nome: "Roupas e calçados", qtd: 8 }],
      data: "25/04/2026",
      dataReceb: "27/04/2026",
      obs: "Roupas infantis tamanho P",
      status: "recebida",
    },
    {
      id: 3,
      ponto: "Ponto Sul",
      itens: [
        { nome: "Brinquedos", qtd: 5 },
        { nome: "Cesta básica", qtd: 2 },
      ],
      data: "05/05/2026",
      dataReceb: null,
      obs: "Brinquedos em bom estado",
      status: "pendente",
    },
    {
      id: 4,
      ponto: "Ponto Centro",
      itens: [{ nome: "Higiene", qtd: 10 }],
      data: "12/05/2026",
      dataReceb: null,
      obs: "",
      status: "pendente",
    },
    {
      id: 5,
      ponto: "Ponto Leste",
      itens: [{ nome: "Cesta básica", qtd: 1 }],
      data: "01/03/2026",
      dataReceb: null,
      obs: "",
      status: "cancelada",
    },
  ];

  let proximoId = 6;
  let filtroAtivo = "todas";

  function contarPorStatus(status) {
    return minhasDoacoes.filter((d) =>
      status === "todas" ? true : d.status === status,
    ).length;
  }

  function atualizarContadorPendentes() {
    document.getElementById("contador-pendentes-doador").textContent =
      contarPorStatus("pendente");
  }

  // esse trecho filtra e monta o histórico de doações
  function renderFiltros() {
    const container = document.getElementById("filtros-doacoes");
    const opcoes = [
      { valor: "todas", label: "Todas" },
      { valor: "pendente", label: "Pendentes" },
      { valor: "recebida", label: "Recebidas" },
      { valor: "cancelada", label: "Canceladas" },
    ];
    container.innerHTML = "";
    opcoes.forEach((op) => {
      const btn = document.createElement("button");
      btn.className = `filtro-doacao${filtroAtivo === op.valor ? " ativo" : ""}`;
      btn.textContent = `${op.label} (${contarPorStatus(op.valor)})`;
      btn.addEventListener("click", () => {
        filtroAtivo = op.valor;
        renderFiltros();
        renderDoacoes();
      });
      container.appendChild(btn);
    });
  }

  function renderDoacoes() {
    const container = document.getElementById("lista-minhas-doacoes");
    const total = minhasDoacoes.length;
    const badge = document.getElementById("badge-total-doacoes");
    if (badge) badge.textContent = `${total} doação${total !== 1 ? "s" : ""}`;

    const lista =
      filtroAtivo === "todas"
        ? minhasDoacoes
        : minhasDoacoes.filter((d) => d.status === filtroAtivo);

    container.innerHTML = "";

    if (lista.length === 0) {
      container.innerHTML = `<div class="sem-solicitacoes">📭 Nenhuma doação encontrada nessa categoria.</div>`;
      return;
    }

    lista.forEach((d) => {
      const itensTexto = d.itens.map((i) => `${i.nome} ×${i.qtd}`).join(" · ");
      const cfg = {
        pendente: {
          classe: "badge-doacao-pendente",
          icone: "⏳",
          label: "Aguardando recebimento",
        },
        recebida: {
          classe: "badge-doacao-recebida",
          icone: "✅",
          label: "Recebida pelo ponto",
        },
        cancelada: {
          classe: "badge-doacao-cancelada",
          icone: "❌",
          label: "Cancelada",
        },
      }[d.status];

      const card = document.createElement("div");
      card.className = `card-doacao-historico card-doacao-${d.status}`;
      card.innerHTML = `
            <div class="card-doacao-topo">
              <span class="badge-status-doacao ${cfg.classe}">${cfg.icone} ${cfg.label}</span>
              <span class="card-doacao-data">📅 ${d.data}</span>
            </div>
            <div class="card-doacao-ponto">📍 ${d.ponto}</div>
            <div class="card-doacao-itens">${itensTexto}</div>
            ${d.obs ? `<div class="card-doacao-obs">💬 ${d.obs}</div>` : ""}
            ${d.dataReceb ? `<div class="card-doacao-receb">✅ Recebida em ${d.dataReceb}</div>` : ""}
            ${
              d.status === "pendente"
                ? `<div class="card-doacao-acoes">
                   <button class="btn-cancelar-doacao" onclick="cancelarDoacao(${d.id})">❌ Cancelar doação</button>
                 </div>`
                : ""
            }`;
      container.appendChild(card);
    });
  }

  // esse trecho prepara o formulário para registrar uma nova doação
  function iniciarFormItens() {
    const container = document.getElementById("lista-itens-form");
    container.innerHTML = "";
    catalogoItens.forEach((item) => {
      const row = document.createElement("div");
      row.className = "item-doacao-row";
      row.innerHTML = `
            <label class="item-doacao-label">
              <input type="checkbox" class="item-doacao-check" data-id="${item.id}" />
              <span>${item.icone} ${item.nome}</span>
            </label>
            <div class="item-doacao-qty" id="qty-${item.id}">
              <input type="number" class="item-doacao-qtd-input" id="qtd-${item.id}" min="1" max="999" placeholder="0" />
              <span class="item-doacao-unidade">${item.unidade}</span>
            </div>`;
      container.appendChild(row);

      row
        .querySelector(".item-doacao-check")
        .addEventListener("change", (e) => {
          const qtyDiv = document.getElementById(`qty-${item.id}`);
          const qtdInput = document.getElementById(`qtd-${item.id}`);
          if (e.target.checked) {
            qtyDiv.classList.add("visivel-qty");
            qtdInput.focus();
          } else {
            qtyDiv.classList.remove("visivel-qty");
            qtdInput.value = "";
          }
          row.classList.toggle("selecionado", e.target.checked);
        });
    });
  }

  function iniciarFormPontos() {
    const sel = document.getElementById("select-ponto");
    pontosDisponiveis.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      if (p.necessidades.length > 0) {
        opt.textContent = `${p.nome} (falta: ${p.necessidades.join(", ")})`;
      } else {
        opt.textContent = `${p.nome} (estoque completo)`;
      }
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => {
      const info = document.getElementById("ponto-info");
      const p = pontosDisponiveis.find((x) => x.id === sel.value);
      if (p) {
        const necessidadesHtml =
          p.necessidades.length > 0
            ? `<span class="ponto-info-falta">⚠️ Itens em falta: <strong>${p.necessidades.join(" · ")}</strong></span>`
            : `<span class="ponto-info-ok">✅ Estoque completo — qualquer doação é bem-vinda!</span>`;
        info.innerHTML = `<span class="ponto-info-endereco">📍 ${p.endereco}</span>${necessidadesHtml}`;
        info.style.display = "flex";
      } else {
        info.style.display = "none";
      }
    });
  }

  document
    .getElementById("btn-registrar-doacao")
    .addEventListener("click", () => {
      const erroEl = document.getElementById("erro-nova-doacao");
      erroEl.textContent = "";

      const pontoId = document.getElementById("select-ponto").value;
      const obs = document.getElementById("obs-doacao").value.trim();

      const itensSelecionados = [];
      catalogoItens.forEach((item) => {
        const check = document.querySelector(
          `.item-doacao-check[data-id="${item.id}"]`,
        );
        const qtdInput = document.getElementById(`qtd-${item.id}`);
        if (check?.checked) {
          const qtd = parseInt(qtdInput?.value || "0", 10);
          if (qtd > 0) itensSelecionados.push({ nome: item.nome, qtd });
        }
      });

      if (!pontoId) {
        erroEl.textContent = "⚠️ Selecione um ponto de coleta.";
        return;
      }
      if (!itensSelecionados.length) {
        erroEl.textContent =
          "⚠️ Selecione ao menos um item com quantidade válida.";
        return;
      }

      const ponto = pontosDisponiveis.find((p) => p.id === pontoId);
      const hoje = new Date();
      const dataHoje = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

      abrirModal({
        icone: "📦",
        titulo: "Confirmar doação",
        texto: `Registrar doação de ${itensSelecionados.map((i) => `${i.nome} ×${i.qtd}`).join(", ")} para "${ponto.nome}"?`,
        corBotao: "verde",
        onConfirmar: () => {
          minhasDoacoes.unshift({
            id: proximoId++,
            ponto: ponto.nome,
            itens: itensSelecionados,
            data: dataHoje,
            dataReceb: null,
            obs,
            status: "pendente",
          });
          iniciarFormItens();
          document.getElementById("select-ponto").value = "";
          document.getElementById("ponto-info").style.display = "none";
          document.getElementById("obs-doacao").value = "";
          filtroAtivo = "pendente";
          atualizarContadorPendentes();
          renderFiltros();
          renderDoacoes();
          mostrarToast(
            `✅ Doação registrada! O ${ponto.nome} será notificado.`,
          );
        },
      });
    });

  window.cancelarDoacao = (id) => {
    const d = minhasDoacoes.find((x) => x.id === id);
    abrirModal({
      icone: "❌",
      titulo: "Cancelar doação",
      texto: `Tem certeza que deseja cancelar a doação para "${d.ponto}"? O ponto de coleta será notificado.`,
      corBotao: "azul",
      onConfirmar: () => {
        d.status = "cancelada";
        atualizarContadorPendentes();
        renderFiltros();
        renderDoacoes();
        mostrarToast(`Doação para ${d.ponto} cancelada.`);
      },
    });
  };

  // esse trecho atualiza o sino e a lista de notificações
  let contadorNotif = 0;
  function adicionarNotificacao(icone, titulo, detalhe) {
    contadorNotif++;
    const badge = document.getElementById("badge-sino");
    badge.textContent = contadorNotif;
    badge.classList.add("visivel");
    const semNotif = document.getElementById("sem-notificacoes");
    if (semNotif) semNotif.remove();
    const lista = document.getElementById("lista-notificacoes");
    const item = document.createElement("div");
    item.className = "item-notificacao";
    item.innerHTML = `<span class="notif-icone">${icone}</span><div class="notif-texto"><strong>${titulo}</strong><span>${detalhe}</span></div>`;
    lista.prepend(item);
  }

  document.getElementById("sino").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("painel-notificacoes").classList.toggle("aberto");
  });

  document.addEventListener("click", () =>
    document.getElementById("painel-notificacoes").classList.remove("aberto"),
  );

  // esse trecho abre o perfil e as outras gavetas do painel
  const gavOv = document.getElementById("gaveta-overlay");

  function fecharTodasGavetas() {
    document
      .querySelectorAll(".gaveta-perfil.aberta")
      .forEach((g) => g.classList.remove("aberta"));
    gavOv.classList.remove("aberta");
    document.body.style.overflow = "";
  }

  function abrirGaveta(id) {
    fecharTodasGavetas();
    document.getElementById(id).classList.add("aberta");
    gavOv.classList.add("aberta");
    document.body.style.overflow = "hidden";
  }

  gavOv.addEventListener("click", fecharTodasGavetas);

  const camposEditaveis = ["gv-nome", "gv-telefone", "gv-ponto-preferido"];
  let valoresOriginais = {};
  const btnEditar = document.getElementById("gaveta-btn-editar");
  const acoesEd = document.getElementById("gaveta-acoes-edicao");

  function sincronizarNome(nome) {
    const inicial = nome.charAt(0).toUpperCase();
    document.getElementById("gaveta-nome-exibido").textContent = nome;
    document.getElementById("gaveta-avatar").textContent = inicial;
    document.getElementById("avatar-inicial").textContent = inicial;
    document.getElementById("avatar-chip").textContent = inicial;
    document.getElementById("titulo-boas-vindas").textContent = `Olá, ${nome}!`;
    document.getElementById("nome-chip").textContent = nome;
  }

  sincronizarNome(document.getElementById("gv-nome").value);

  document.getElementById("btn-abrir-perfil").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta("gaveta-perfil");
  });
  document
    .getElementById("chip-usuario")
    .addEventListener("click", () => abrirGaveta("gaveta-perfil"));
  document
    .getElementById("gaveta-fechar")
    .addEventListener("click", fecharTodasGavetas);

  btnEditar.addEventListener("click", () => {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      valoresOriginais[id] = inp.value;
      inp.disabled = false;
    });
    btnEditar.style.display = "none";
    acoesEd.classList.add("visivel");
    document.getElementById("gv-nome").focus();
  });

  function sairModoEdicao(salvar) {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      if (!salvar) inp.value = valoresOriginais[id] ?? inp.value;
      inp.disabled = true;
    });
    btnEditar.style.display = "";
    acoesEd.classList.remove("visivel");
  }

  document
    .getElementById("gaveta-btn-cancelar")
    .addEventListener("click", () => sairModoEdicao(false));
  document.getElementById("gaveta-btn-salvar").addEventListener("click", () => {
    sairModoEdicao(true);
    const novoNome = document.getElementById("gv-nome").value.trim();
    if (novoNome) sincronizarNome(novoNome);
    mostrarToast("✅ Perfil atualizado com sucesso!");
  });

  document.getElementById("btn-abrir-ajuda").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta("gaveta-ajuda");
  });
  document
    .getElementById("gaveta-ajuda-fechar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("gaveta-ajuda-cancelar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("gaveta-ajuda-enviar")
    .addEventListener("click", () => {
      const assunto = document.getElementById("sac-assunto").value;
      const mensagem = document.getElementById("sac-mensagem").value.trim();
      if (!assunto) {
        mostrarToast("⚠️ Selecione um assunto.");
        return;
      }
      if (!mensagem) {
        mostrarToast("⚠️ Escreva sua mensagem.");
        return;
      }
      document.getElementById("sac-assunto").value = "";
      document.getElementById("sac-mensagem").value = "";
      fecharTodasGavetas();
      mostrarToast("✅ Mensagem enviada! Retornaremos em até 2 dias úteis.");
    });

  document.getElementById("btn-ir-doacoes").addEventListener("click", (e) => {
    e.preventDefault();
    document
      .getElementById("secao-minhas-doacoes")
      .scrollIntoView({ behavior: "smooth" });
  });

  iniciarFormPontos();
  iniciarFormItens();
  renderFiltros();
  renderDoacoes();
  atualizarContadorPendentes();

  adicionarNotificacao(
    "✅",
    "Doação recebida",
    "Ponto Centro recebeu sua doação de 10/04.",
  );
  adicionarNotificacao(
    "📦",
    "Doação registrada",
    "Ponto Sul aguarda seus itens.",
  );
}

// esse bloco controla o estoque, as solicitações e o perfil do ponto de coleta
function iniciarDashboardPonto() {
  if (!document.getElementById("contador-pendentes")) return;

  // esse trecho mostra mensagens e confirma as ações do ponto de coleta
  function mostrarToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("visivel");
    setTimeout(() => t.classList.remove("visivel"), 3500);
  }

  function abrirModal({ icone, titulo, texto, corBotao, onConfirmar }) {
    document.getElementById("modal-icone").textContent = icone;
    document.getElementById("modal-titulo").textContent = titulo;
    document.getElementById("modal-texto").textContent = texto;
    const btn = document.getElementById("modal-confirmar");
    btn.className = `btn-modal-confirmar ${corBotao}`;
    document.getElementById("modal-overlay").classList.add("aberto");
    btn.onclick = () => {
      document.getElementById("modal-overlay").classList.remove("aberto");
      onConfirmar();
    };
  }

  document.getElementById("modal-cancelar").onclick = () =>
    document.getElementById("modal-overlay").classList.remove("aberto");

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay"))
      document.getElementById("modal-overlay").classList.remove("aberto");
  });

  // esse trecho guarda o estoque, as doações e as solicitações do painel
  const estoqueAtual = [
    {
      id: "cesta",
      icone: "🛒",
      categoria: "Cesta básica",
      descricao: "Arroz, feijão, óleo, macarrão, sal, açúcar",
      qtd: 45,
      unidade: "cestas",
    },
    {
      id: "higiene",
      icone: "🧴",
      categoria: "Higiene",
      descricao: "Sabonete, shampoo, pasta de dente, absorvente",
      qtd: 120,
      unidade: "kits",
    },
    {
      id: "roupas",
      icone: "👕",
      categoria: "Roupas e calçados",
      descricao: "Roupas adulto/infantil, calçados variados",
      qtd: 89,
      unidade: "peças",
    },
    {
      id: "brinquedos",
      icone: "🧸",
      categoria: "Brinquedos",
      descricao: "Jogos, bonecas, carrinhos",
      qtd: 34,
      unidade: "itens",
    },
  ];

  const doacoesPendentes = [
    {
      id: 1,
      doador: "Roberto Mendes",
      iniciais: "RM",
      telefone: "(11) 98765-4321",
      data: "18/05/2026",
      obs: "Pode entregar pela manhã",
      itens: [
        { nome: "Cesta básica", qtd: 3 },
        { nome: "Higiene", qtd: 2 },
      ],
    },
    {
      id: 2,
      doador: "Sandra Lima",
      iniciais: "SL",
      telefone: "(11) 91234-5678",
      data: "19/05/2026",
      obs: "",
      itens: [{ nome: "Roupas e calçados", qtd: 10 }],
    },
    {
      id: 3,
      doador: "Empresa TechCorp",
      iniciais: "TC",
      telefone: "(11) 3333-4444",
      data: "20/05/2026",
      obs: "Entrega em caixas identificadas",
      itens: [
        { nome: "Cesta básica", qtd: 15 },
        { nome: "Higiene", qtd: 8 },
        { nome: "Brinquedos", qtd: 5 },
      ],
    },
    {
      id: 4,
      doador: "Paulo Ferreira",
      iniciais: "PF",
      telefone: "(11) 99876-5432",
      data: "21/05/2026",
      obs: "",
      itens: [{ nome: "Brinquedos", qtd: 6 }],
    },
  ];

  const solicitacoesPendentes = [
    {
      id: 1,
      nome: "Maria da Silva",
      itens: ["Cesta básica", "Higiene"],
      modalidade: "retirada",
      data: "20/05/2026",
      obs: "",
    },
    {
      id: 2,
      nome: "João Pereira",
      itens: ["Cesta básica"],
      modalidade: "entrega_voluntario",
      data: "21/05/2026",
      obs: "Moro no 3º andar, sem elevador",
      voluntario: {
        nome: "Maria Carvalho",
        iniciais: "MC",
        info: "Aceita entregar Ter ou Qui",
      },
    },
    {
      id: 3,
      nome: "Ana Lima",
      itens: ["Roupas e calçados", "Brinquedos"],
      modalidade: "retirada",
      data: "22/05/2026",
      obs: "Calçado tam. 38 adulto, tam. 28 criança",
    },
    {
      id: 4,
      nome: "Carlos Santos",
      itens: ["Higiene"],
      modalidade: "entrega_voluntario",
      data: "22/05/2026",
      obs: "",
      voluntario: {
        nome: "Lucas Silva",
        iniciais: "LS",
        info: "Disponível Seg, Qua, Sex",
      },
    },
    {
      id: 5,
      nome: "Fernanda Rocha",
      itens: ["Cesta básica", "Brinquedos"],
      modalidade: "retirada",
      data: "23/05/2026",
      obs: "Família com 2 crianças pequenas",
    },
    {
      id: 6,
      nome: "Paulo Lima",
      itens: ["Cesta básica"],
      modalidade: "entrega_voluntario",
      data: "17/05/2026",
      obs: "",
      status: "confirmada",
      voluntario: {
        nome: "Juliana Alves",
        iniciais: "JA",
        info: "Previsto às 11h30",
      },
    },
    {
      id: 7,
      nome: "Ana Costa",
      itens: ["Higiene", "Roupas"],
      modalidade: "entrega_voluntario",
      data: "17/05/2026",
      obs: "",
      status: "retirada",
      resolvida: true,
      voluntario: {
        nome: "Felipe Oliveira",
        iniciais: "FO",
        info: "Saiu às 09h20",
      },
    },
    {
      id: 8,
      nome: "Beatriz Sousa",
      itens: ["Cesta básica"],
      modalidade: "retirada",
      data: "16/05/2026",
      obs: "",
      status: "entregue",
      resolvida: true,
    },
    {
      id: 9,
      nome: "Ricardo Nunes",
      itens: ["Higiene"],
      modalidade: "entrega_voluntario",
      data: "15/05/2026",
      obs: "",
      status: "entregue",
      resolvida: true,
      voluntario: {
        nome: "Carla Mendes",
        iniciais: "CM",
        info: "Entregue com sucesso",
      },
    },
  ];

  // esse trecho separa e mostra as solicitações por situação
  function renderSolicitacoes() {
    const container = document.getElementById("lista-solicitacoes-pendentes");
    container.innerHTML = "";

    const grupoBenef = solicitacoesPendentes.filter(
      (s) => s.modalidade === "retirada" && !s.resolvida,
    );
    const grupoVolunt = solicitacoesPendentes.filter(
      (s) => s.modalidade === "entrega_voluntario" && !s.resolvida,
    );
    const grupoEmRota = solicitacoesPendentes.filter(
      (s) => s.status === "retirada",
    );
    const grupoConcl = solicitacoesPendentes.filter(
      (s) => s.resolvida && s.status !== "retirada" && s.status !== "recusada",
    );

    const totalVisivel =
      grupoBenef.length +
      grupoVolunt.length +
      grupoEmRota.length +
      grupoConcl.length;
    if (totalVisivel === 0) {
      container.innerHTML = `<div class="sem-solicitacoes">✅ Nenhuma solicitação no momento.</div>`;
      return;
    }

    const blocoVol = (s) =>
      s.voluntario
        ? `
          <div class="solicitacao-voluntario">
            <div class="solicitacao-voluntario-avatar">${s.voluntario.iniciais}</div>
            <div class="solicitacao-dados"><strong>${s.voluntario.nome}</strong><span>${s.voluntario.info}</span></div>
          </div>`
        : "";

    const criarCard = (
      s,
      { extraClasse = "", badgeTopo = "", botoes = "" } = {},
    ) => {
      const iniciais = s.nome
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("");
      const iconeModal = s.modalidade === "retirada" ? "🚶" : "🏠";
      const textoModal =
        s.modalidade === "retirada"
          ? "Retirada no ponto"
          : "Entrega por voluntário";
      const div = document.createElement("div");
      div.className = `card-solicitacao${extraClasse ? " " + extraClasse : ""}`;
      div.innerHTML = `
            ${badgeTopo}
            <div class="solicitacao-info">
              <div class="solicitacao-avatar">${iniciais}</div>
              <div class="solicitacao-dados">
                <strong>${s.nome}</strong>
                <span>${s.itens.join(" · ")}</span>
                ${s.obs ? `<span class="solicitacao-obs">💬 ${s.obs}</span>` : ""}
              </div>
            </div>
            ${blocoVol(s)}
            <div class="solicitacao-meta">
              <span class="solicitacao-modalidade">${iconeModal} ${textoModal}</span>
              <span class="solicitacao-data">📅 ${s.data}</span>
            </div>
            ${botoes ? `<div class="solicitacao-acoes">${botoes}</div>` : ""}`;
      container.appendChild(div);
    };

    const criarSecao = (titulo, icone, lista) => {
      if (!lista.length) return;
      const h = document.createElement("div");
      h.className = "solicitacoes-secao-titulo";
      h.innerHTML = `<span>${icone} ${titulo}</span><span class="badge-secao-count">${lista.length}</span>`;
      container.appendChild(h);
    };

    criarSecao("Retirada pelo beneficiário", "🚶", grupoBenef);
    grupoBenef.forEach((s) =>
      criarCard(s, {
        botoes: `<button class="btn-confirmar-solic" onclick="confirmarSolicitacao(${s.id})">✅ Confirmar</button>
                   <button class="btn-recusar-solic"   onclick="recusarSolicitacao(${s.id})">❌ Recusar</button>`,
      }),
    );

    criarSecao("Entrega por voluntário", "🏠", grupoVolunt);

    grupoVolunt
      .filter((s) => !s.status)
      .forEach((s) =>
        criarCard(s, {
          botoes: `<button class="btn-confirmar-solic" onclick="confirmarSolicitacao(${s.id})">✅ Confirmar</button>
                   <button class="btn-recusar-solic"   onclick="recusarSolicitacao(${s.id})">❌ Recusar</button>`,
        }),
      );

    const confirmadas = grupoVolunt.filter((s) => s.status === "confirmada");
    if (confirmadas.length) {
      const lista = document.createElement("div");
      lista.className = "lista-confirmada";
      confirmadas.forEach((s) => {
        const iniciais = s.nome
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("");
        const volNome = s.voluntario ? s.voluntario.nome : "Voluntário";
        const volInfo = s.voluntario ? ` · ${s.voluntario.info}` : "";
        const li = document.createElement("div");
        li.className = "linha-confirmada";
        li.innerHTML = `
              <div class="linha-confirmada-avatar">${iniciais}</div>
              <div class="linha-confirmada-info">
                <strong>${s.nome}</strong>
                <span>🚶 ${volNome}${volInfo}</span>
              </div>
              <button class="btn-confirmar-solic btn-confirmada-aguardando btn-linha" onclick="marcarRetirado(${s.id})">📦 Retirou</button>`;
        lista.appendChild(li);
      });
      container.appendChild(lista);
    }

    criarSecao("Em rota · voluntário entregando", "🚴", grupoEmRota);
    if (grupoEmRota.length) {
      const lista = document.createElement("div");
      lista.className = "lista-em-rota";
      grupoEmRota.forEach((s) => {
        const iniciais = s.nome
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("");
        const volNome = s.voluntario ? s.voluntario.nome : "Voluntário";
        const li = document.createElement("div");
        li.className = "linha-em-rota";
        li.innerHTML = `
              <div class="linha-em-rota-avatar">${iniciais}</div>
              <div class="linha-em-rota-info">
                <strong>${s.nome}</strong>
                <span>${s.itens.join(", ")} · 🚴 ${volNome}</span>
              </div>
              <span class="linha-em-rota-status">em rota</span>`;
        lista.appendChild(li);
      });
      container.appendChild(lista);
    }

    criarSecao("Concluídas", "✅", grupoConcl);
    if (grupoConcl.length) {
      const lista = document.createElement("div");
      lista.className = "lista-concluidas";
      grupoConcl.forEach((s) => {
        const iniciais = s.nome
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join("");
        const icone = s.modalidade === "retirada" ? "🚶" : "🏠";
        const volNome = s.voluntario ? ` · ${s.voluntario.nome}` : "";
        const li = document.createElement("div");
        li.className = "linha-concluida";
        li.innerHTML = `
              <div class="linha-concluida-avatar">${iniciais}</div>
              <div class="linha-concluida-info">
                <strong>${s.nome}</strong>
                <span>${s.itens.join(", ")}${volNome}</span>
              </div>
              <span class="linha-concluida-meta">${icone} ${s.data}</span>`;
        lista.appendChild(li);
      });
      container.appendChild(lista);
    }
  }

  function atualizarContadorPendentes() {
    const qtd = solicitacoesPendentes.filter(
      (s) => !s.resolvida && (!s.status || s.status === "pendente"),
    ).length;
    document.getElementById("contador-pendentes").textContent = qtd;
    document.getElementById("badge-pendentes").textContent =
      `${qtd} pendente${qtd !== 1 ? "s" : ""}`;
  }

  // esse trecho atualiza o estoque e as doações que ainda vão chegar
  function renderEstoque() {
    const tbody = document.getElementById("corpo-estoque");
    if (!tbody) return;
    tbody.innerHTML = estoqueAtual
      .map((item) => {
        const status =
          item.qtd >= 30
            ? `<span class="tag-estoque-ok">Disponível</span>`
            : item.qtd > 0
              ? `<span class="tag-estoque-baixo">Estoque baixo</span>`
              : `<span class="tag-estoque-vazio">Esgotado</span>`;
        return `<tr>
              <td>${item.icone} ${item.categoria}</td>
              <td>${item.descricao}</td>
              <td><strong>${item.qtd}</strong> ${item.unidade}</td>
              <td>${status}</td>
            </tr>`;
      })
      .join("");
  }

  function renderDoacoes(filtro = "") {
    const container = document.getElementById("lista-doacoes-dinamica");
    const titulo = document.getElementById("titulo-doacoes-gaveta");
    if (!container) return;
    const pendentes = doacoesPendentes.filter((d) => !d.recebida);
    const filtradas = filtro
      ? pendentes.filter((d) =>
          d.doador.toLowerCase().includes(filtro.toLowerCase()),
        )
      : pendentes;
    if (titulo)
      titulo.textContent = `Doações aguardando recebimento (${pendentes.length})`;
    container.innerHTML = "";
    if (filtradas.length === 0) {
      container.innerHTML = `<div class="sem-solicitacoes" style="margin:0;">${filtro ? "Nenhum doador encontrado com esse nome." : "📦 Nenhuma doação aguardando recebimento."}</div>`;
      return;
    }
    const lista = document.createElement("div");
    lista.className = "lista-doacoes";
    filtradas.forEach((d) => {
      const itensTexto = d.itens.map((i) => `${i.nome} ×${i.qtd}`).join(" · ");
      const div = document.createElement("div");
      div.className = "linha-doacao";
      div.innerHTML = `
            <div class="linha-doacao-avatar">${d.iniciais}</div>
            <div class="linha-doacao-info">
              <strong>${d.doador}</strong>
              <span>${itensTexto}</span>
              ${d.obs ? `<span>💬 ${d.obs}</span>` : ""}
              <span class="linha-doacao-meta">📅 ${d.data}${d.telefone ? ` · ☎ ${d.telefone}` : ""}</span>
            </div>
            <button class="btn-receber-doacao btn-linha" onclick="confirmarDoacao(${d.id})">✅ Receber</button>`;
      lista.appendChild(div);
    });
    container.appendChild(lista);
  }

  function atualizarContadorDoacoes() {
    const qtd = doacoesPendentes.filter((d) => !d.recebida).length;
    const el = document.getElementById("contador-doacoes-card");
    if (el) el.textContent = qtd;
  }

  window.confirmarDoacao = (id) => {
    const d = doacoesPendentes.find((x) => x.id === id);
    const mapaEstoque = {
      "Cesta básica": "cesta",
      Higiene: "higiene",
      "Roupas e calçados": "roupas",
      Brinquedos: "brinquedos",
    };
    const listaItens = d.itens.map((i) => `${i.nome} ×${i.qtd}`).join(", ");
    abrirModal({
      icone: "📦",
      titulo: "Confirmar recebimento",
      texto: `Confirmar recebimento da doação de "${d.doador}"? Os itens (${listaItens}) serão adicionados ao estoque.`,
      corBotao: "verde",
      onConfirmar: () => {
        d.recebida = true;
        d.itens.forEach((item) => {
          const stock = estoqueAtual.find(
            (e) => e.id === mapaEstoque[item.nome],
          );
          if (stock) stock.qtd += item.qtd;
        });
        renderDoacoes();
        renderEstoque();
        atualizarContadorDoacoes();
        mostrarToast(`✅ Doação de ${d.doador} recebida! Estoque atualizado.`);
      },
    });
  };

  window.confirmarSolicitacao = (id) => {
    const s = solicitacoesPendentes.find((x) => x.id === id);
    const isVoluntario = s.modalidade === "entrega_voluntario";
    const textoExtra =
      isVoluntario && s.voluntario
        ? ` O voluntário ${s.voluntario.nome} será notificado para vir buscar os itens.`
        : "";
    abrirModal({
      icone: "✅",
      titulo: "Confirmar solicitação",
      texto: `Confirmar o atendimento de "${s.nome}"? Os itens serão reservados e o beneficiário será notificado.${textoExtra}`,
      corBotao: "verde",
      onConfirmar: () => {
        if (isVoluntario && s.voluntario) {
          s.status = "confirmada";
        } else {
          s.resolvida = true;
        }
        renderSolicitacoes();
        atualizarContadorPendentes();
        mostrarToast(`✅ Solicitação de ${s.nome} confirmada!`);
      },
    });
  };

  window.marcarRetirado = (id) => {
    const s = solicitacoesPendentes.find((x) => x.id === id);
    abrirModal({
      icone: "📦",
      titulo: "Confirmar retirada",
      texto: `O voluntário ${s.voluntario?.nome ?? ""} retirou os itens para entrega a "${s.nome}"?`,
      corBotao: "verde",
      onConfirmar: () => {
        s.status = "retirada";
        s.resolvida = true;
        renderSolicitacoes();
        atualizarContadorPendentes();
        mostrarToast(
          `🚴 ${s.voluntario?.nome ?? "Voluntário"} saiu para entregar a ${s.nome}!`,
        );
      },
    });
  };

  window.marcarEntregue = (id) => {
    const s = solicitacoesPendentes.find((x) => x.id === id);
    abrirModal({
      icone: "✅",
      titulo: "Confirmar entrega",
      texto: `O voluntário ${s.voluntario?.nome ?? ""} entregou os itens a "${s.nome}"?`,
      corBotao: "verde",
      onConfirmar: () => {
        s.status = "entregue";
        s.resolvida = true;
        renderSolicitacoes();
        atualizarContadorPendentes();
        mostrarToast(`✅ Entrega a ${s.nome} confirmada!`);
      },
    });
  };

  window.recusarSolicitacao = (id) => {
    const s = solicitacoesPendentes.find((x) => x.id === id);
    abrirModal({
      icone: "❌",
      titulo: "Recusar solicitação",
      texto: `Tem certeza que deseja recusar a solicitação de "${s.nome}"? O beneficiário será notificado.`,
      corBotao: "azul",
      onConfirmar: () => {
        s.status = "recusada";
        s.resolvida = true;
        renderSolicitacoes();
        atualizarContadorPendentes();
        mostrarToast(`Solicitação de ${s.nome} recusada.`);
      },
    });
  };

  renderSolicitacoes();
  renderEstoque();
  renderDoacoes();
  atualizarContadorDoacoes();

  // esse trecho atualiza o sino e as notificações do ponto
  let contadorNotif = 0;

  function adicionarNotificacao(icone, titulo, detalhe) {
    contadorNotif++;
    const badge = document.getElementById("badge-sino");
    badge.textContent = contadorNotif;
    badge.classList.add("visivel");
    const semNotif = document.getElementById("sem-notificacoes");
    if (semNotif) semNotif.remove();
    const lista = document.getElementById("lista-notificacoes");
    const item = document.createElement("div");
    item.className = "item-notificacao";
    item.innerHTML = `<span class="notif-icone">${icone}</span><div class="notif-texto"><strong>${titulo}</strong><span>${detalhe}</span></div>`;
    lista.prepend(item);
  }

  document.getElementById("sino").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("painel-notificacoes").classList.toggle("aberto");
  });

  document.addEventListener("click", () =>
    document.getElementById("painel-notificacoes").classList.remove("aberto"),
  );

  // esse trecho abre o perfil e as outras gavetas do painel
  const gavOv = document.getElementById("gaveta-overlay");

  function fecharTodasGavetas() {
    document
      .querySelectorAll(".gaveta-perfil.aberta")
      .forEach((g) => g.classList.remove("aberta"));
    gavOv.classList.remove("aberta");
    document.body.style.overflow = "";
  }

  function abrirGaveta(id) {
    fecharTodasGavetas();
    document.getElementById(id).classList.add("aberta");
    gavOv.classList.add("aberta");
    document.body.style.overflow = "hidden";
  }

  gavOv.addEventListener("click", fecharTodasGavetas);

  const camposEditaveis = [
    "gv-nome",
    "gv-responsavel",
    "gv-telefone",
    "gv-rua",
    "gv-bairro",
    "gv-cidade",
    "gv-horario",
  ];
  let valoresOriginais = {};
  const btnEditar = document.getElementById("gaveta-btn-editar");
  const acoesEd = document.getElementById("gaveta-acoes-edicao");

  function sincronizarNome(nome) {
    const inicial = nome.charAt(0).toUpperCase();
    document.getElementById("gaveta-nome-exibido").textContent = nome;
    document.getElementById("gaveta-avatar").textContent = inicial;
    document.getElementById("avatar-inicial").textContent = inicial;
    document.getElementById("avatar-chip").textContent = inicial;
    document.getElementById("titulo-boas-vindas").textContent = `Olá, ${nome}!`;
    document.getElementById("nome-chip").textContent = nome;
  }

  sincronizarNome(document.getElementById("gv-nome").value);

  document.getElementById("btn-abrir-perfil").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta("gaveta-perfil");
  });
  document
    .getElementById("chip-usuario")
    .addEventListener("click", () => abrirGaveta("gaveta-perfil"));
  document
    .getElementById("gaveta-fechar")
    .addEventListener("click", fecharTodasGavetas);

  btnEditar.addEventListener("click", () => {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      valoresOriginais[id] = inp.value;
      inp.disabled = false;
    });
    btnEditar.style.display = "none";
    acoesEd.classList.add("visivel");
    document.getElementById("gv-nome").focus();
  });

  function sairModoEdicao(salvar) {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      if (!salvar) inp.value = valoresOriginais[id] ?? inp.value;
      inp.disabled = true;
    });
    btnEditar.style.display = "";
    acoesEd.classList.remove("visivel");
  }

  document
    .getElementById("gaveta-btn-cancelar")
    .addEventListener("click", () => sairModoEdicao(false));
  document.getElementById("gaveta-btn-salvar").addEventListener("click", () => {
    sairModoEdicao(true);
    const novoNome = document.getElementById("gv-nome").value.trim();
    if (novoNome) sincronizarNome(novoNome);
    mostrarToast("✅ Perfil atualizado com sucesso!");
  });

  document
    .getElementById("btn-abrir-doacoes")
    .addEventListener("click", (e) => {
      e.preventDefault();
      renderDoacoes();
      abrirGaveta("gaveta-doacoes");
    });
  document
    .getElementById("gaveta-doacoes-fechar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("busca-doador")
    .addEventListener("input", (e) => renderDoacoes(e.target.value));

  document.getElementById("btn-abrir-ajuda").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta("gaveta-ajuda");
  });
  document
    .getElementById("gaveta-ajuda-fechar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("gaveta-ajuda-cancelar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("gaveta-ajuda-enviar")
    .addEventListener("click", () => {
      const assunto = document.getElementById("sac-assunto").value;
      const mensagem = document.getElementById("sac-mensagem").value.trim();
      if (!assunto) {
        mostrarToast("⚠️ Selecione um assunto.");
        return;
      }
      if (!mensagem) {
        mostrarToast("⚠️ Escreva sua mensagem.");
        return;
      }
      document.getElementById("sac-assunto").value = "";
      document.getElementById("sac-mensagem").value = "";
      fecharTodasGavetas();
      mostrarToast("✅ Mensagem enviada! Retornaremos em até 2 dias úteis.");
    });

  document
    .getElementById("btn-ir-solicitacoes")
    .addEventListener("click", (e) => {
      e.preventDefault();
      document
        .getElementById("secao-solicitacoes")
        .scrollIntoView({ behavior: "smooth" });
    });
}

// esse bloco controla as entregas, os pontos e o perfil do voluntário
function iniciarDashboardVoluntario() {
  if (!document.getElementById("saldo-pontos-display")) return;

  // esse trecho mostra mensagens e confirma as ações do voluntário
  function mostrarToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("visivel");
    setTimeout(() => t.classList.remove("visivel"), 3500);
  }

  function abrirModal({ icone, titulo, texto, corBotao, onConfirmar }) {
    document.getElementById("modal-icone").textContent = icone;
    document.getElementById("modal-titulo").textContent = titulo;
    document.getElementById("modal-texto").textContent = texto;
    const btn = document.getElementById("modal-confirmar");
    btn.className = `btn-modal-confirmar ${corBotao}`;
    document.getElementById("modal-overlay").classList.add("aberto");
    btn.onclick = () => {
      document.getElementById("modal-overlay").classList.remove("aberto");
      onConfirmar();
    };
  }

  document.getElementById("modal-cancelar").onclick = () =>
    document.getElementById("modal-overlay").classList.remove("aberto");

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay"))
      document.getElementById("modal-overlay").classList.remove("aberto");
  });

  // esse trecho guarda as entregas atuais e as que ainda estão disponíveis
  let minhasEntregas = [
    {
      id: 1,
      beneficiario: "Maria Silva",
      iniciais: "MS",
      endereco: "Rua das Palmeiras, 45 — Vila Nova",
      ponto: "Ponto Centro",
      distancia: 2.0,
      itens: [
        { nome: "Cesta básica", qtd: 2 },
        { nome: "Higiene", qtd: 1 },
      ],
      data: "17/05/2026",
      obs: "Entregar pela manhã",
      status: "pendente",
    },
    {
      id: 2,
      beneficiario: "João Ferreira",
      iniciais: "JF",
      endereco: "Av. das Acácias, 120 — Jardim Bela",
      ponto: "Ponto Norte",
      distancia: 3.5,
      itens: [{ nome: "Roupas e calçados", qtd: 5 }],
      data: "17/05/2026",
      obs: "",
      status: "em_rota",
    },
    {
      id: 5,
      beneficiario: "Lúcia Santos",
      iniciais: "LS",
      endereco: "Av. Central, 55 — Santo André",
      ponto: "Ponto Centro",
      distancia: 2.5,
      itens: [{ nome: "Higiene", qtd: 3 }],
      data: "18/05/2026",
      obs: "Idosa, cuidado ao subir",
      status: "pendente",
    },
  ];

  let entregasDisponiveis = [
    {
      id: 10,
      beneficiario: "Carlos Mendes",
      iniciais: "CM",
      endereco: "Rua dos Pinheiros, 210 — Pinheiros",
      ponto: "Ponto Centro",
      distancia: 1.5,
      itens: [{ nome: "Cesta básica", qtd: 1 }],
    },
    {
      id: 11,
      beneficiario: "Fernanda Lima",
      iniciais: "FL",
      endereco: "Av. São João, 550 — República",
      ponto: "Ponto Norte",
      distancia: 3.0,
      itens: [
        { nome: "Higiene", qtd: 2 },
        { nome: "Brinquedos", qtd: 1 },
      ],
    },
    {
      id: 12,
      beneficiario: "Roberto Costa",
      iniciais: "RC",
      endereco: "Rua Vergueiro, 800 — Liberdade",
      ponto: "Ponto Sul",
      distancia: 4.5,
      itens: [{ nome: "Cesta básica", qtd: 2 }],
    },
    {
      id: 13,
      beneficiario: "Mariana Souza",
      iniciais: "MS",
      endereco: "Av. Paulista, 1200 — Bela Vista",
      ponto: "Ponto Leste",
      distancia: 2.0,
      itens: [{ nome: "Roupas e calçados", qtd: 3 }],
    },
    {
      id: 14,
      beneficiario: "Tamíres Almeida",
      iniciais: "TA",
      endereco: "Rua Augusta, 300 — Consolidação",
      ponto: "Ponto Sul",
      distancia: 1.0,
      itens: [
        { nome: "Cesta básica", qtd: 1 },
        { nome: "Higiene", qtd: 1 },
      ],
    },
  ];

  let filtroAtivo = "todas";

  // esse trecho calcula os pontos e controla os cupons do voluntário
  let saldoPontos = 47;
  let cuponsResgatados = [];

  function calcularPontos(distancia) {
    return Math.floor(distancia / 0.5);
  }

  function atualizarSaldoPontos() {
    document
      .querySelectorAll("#saldo-pontos-display, #saldo-cupons-valor")
      .forEach((el) => {
        if (el) el.textContent = saldoPontos;
      });
  }

  const cuponsDisponiveis = [
    {
      id: 1,
      icone: "🎬",
      categoria: "Cinema",
      nome: "Ingresso Cinemark",
      desc: "1 ingresso meia-entrada em qualquer sessão",
      pontos: 15,
    },
    {
      id: 2,
      icone: "🎵",
      categoria: "Shows",
      nome: "Show 20% OFF",
      desc: "Desconto em ingressos selecionados via Ingresse",
      pontos: 25,
    },
    {
      id: 3,
      icone: "💻",
      categoria: "Tecnologia",
      nome: "Kabum R$ 50 OFF",
      desc: "R$ 50 de desconto em compras acima de R$ 200",
      pontos: 30,
    },
    {
      id: 4,
      icone: "🎮",
      categoria: "Games",
      nome: "Game Pass 1 mês",
      desc: "1 mês de Xbox Game Pass Ultimate",
      pontos: 40,
    },
    {
      id: 5,
      icone: "🍕",
      categoria: "Alimentação",
      nome: "Pizza Hut 20%",
      desc: "20% de desconto em qualquer pedido",
      pontos: 10,
    },
    {
      id: 6,
      icone: "📱",
      categoria: "Tecnologia",
      nome: "TIM R$ 30",
      desc: "R$ 30 de crédito em conta TIM",
      pontos: 20,
    },
    {
      id: 7,
      icone: "🎭",
      categoria: "Cultura",
      nome: "Museu Gratuito",
      desc: "2 entradas gratuitas no Museu de Arte",
      pontos: 8,
    },
    {
      id: 8,
      icone: "🎪",
      categoria: "Lazer",
      nome: "Ingresso Hopi Hari",
      desc: "1 entrada no parque de diversões",
      pontos: 65,
    },
  ];

  function renderCupons() {
    const container = document.getElementById("lista-cupons");
    if (!container) return;
    atualizarSaldoPontos();
    container.innerHTML = "";

    const secDisp = document.createElement("div");
    secDisp.className = "gaveta-secao-titulo";
    secDisp.style.cssText = "padding: 14px 20px 8px; font-size:.72rem;";
    secDisp.textContent = "Disponíveis para resgatar";
    container.appendChild(secDisp);

    cuponsDisponiveis.forEach((c) => {
      const podeResgatar = saldoPontos >= c.pontos;
      const item = document.createElement("div");
      item.className = `card-cupom${podeResgatar ? "" : " indisponivel"}`;
      item.innerHTML = `
            <div class="card-cupom-icone">${c.icone}</div>
            <div class="card-cupom-info">
              <span class="card-cupom-categoria">${c.categoria}</span>
              <strong class="card-cupom-nome">${c.nome}</strong>
              <span class="card-cupom-desc">${c.desc}</span>
            </div>
            <div class="card-cupom-acao">
              <span class="card-cupom-custo">${c.pontos} pts</span>
              <button class="btn-resgatar${podeResgatar ? "" : " desabilitado"}" ${podeResgatar ? `onclick="resgatarCupom(${c.id})"` : "disabled"}>
                ${podeResgatar ? "Resgatar" : "Sem saldo"}
              </button>
            </div>`;
      container.appendChild(item);
    });

    if (cuponsResgatados.length > 0) {
      const sep = document.createElement("div");
      sep.className = "cupons-resgatados-sep";
      sep.innerHTML = `<span>Meus cupons resgatados</span><span class="cupons-resgatados-badge">${cuponsResgatados.length}</span>`;
      container.appendChild(sep);

      cuponsResgatados.forEach((r) => {
        const item = document.createElement("div");
        item.className = "card-cupom card-cupom-resgatado";
        item.innerHTML = `
              <div class="card-cupom-icone">${r.icone}</div>
              <div class="card-cupom-info">
                <span class="card-cupom-categoria">${r.categoria}</span>
                <strong class="card-cupom-nome">${r.nome}</strong>
                <span class="card-cupom-codigo">Código: <code>${r.codigo}</code></span>
              </div>
              <div class="card-cupom-acao">
                <button class="btn-usar-cupom" onclick="usarCupom('${r.codigo}')">Marcar usado</button>
              </div>`;
        container.appendChild(item);
      });
    }
  }

  window.usarCupom = (codigo) => {
    cuponsResgatados = cuponsResgatados.filter((r) => r.codigo !== codigo);
    renderCupons();
    mostrarToast("✅ Cupom marcado como usado!");
  };

  window.resgatarCupom = (id) => {
    const c = cuponsDisponiveis.find((x) => x.id === id);
    abrirModal({
      icone: c.icone,
      titulo: "Resgatar cupom",
      texto: `Resgatar "${c.nome}" por ${c.pontos} pontos? Seu saldo passará para ${saldoPontos - c.pontos} pontos.`,
      corBotao: "verde",
      onConfirmar: () => {
        saldoPontos -= c.pontos;
        const codigo = `MESA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        cuponsResgatados.unshift({ ...c, codigo });
        renderCupons();
        renderEntregas();
        mostrarToast(`🎉 "${c.nome}" resgatado! Código: ${codigo}`);
      },
    });
  };

  // esse trecho monta o certificado com os dados mais recentes
  function atualizarCertificado() {
    const entreguesAgora = minhasEntregas.filter(
      (e) => e.status === "entregue",
    ).length;
    const totalEntregas = 10 + entreguesAgora;
    const totalHoras = (totalEntregas * 1.5).toFixed(1).replace(".", ",");
    const elE = document.getElementById("cert-entregas");
    const elH = document.getElementById("cert-horas");
    if (elE) elE.textContent = totalEntregas;
    if (elH) elH.textContent = `${totalHoras}h`;
    const nomeEl = document.getElementById("cert-nome");
    const nomeInput = document.getElementById("cert-nome-input");
    if (nomeEl && nomeInput) nomeEl.textContent = nomeInput.value;
  }

  function contarPorStatus(status) {
    return minhasEntregas.filter((e) =>
      status === "todas" ? true : e.status === status,
    ).length;
  }

  function atualizarContadores() {
    document.getElementById("contador-em-rota").textContent =
      contarPorStatus("em_rota");
    document.getElementById("contador-pendentes-vol").textContent =
      contarPorStatus("pendente");
  }

  function buildProgressoHTML(status) {
    const passos = [
      { key: "pendente", label: "Retirar no ponto", icone: "📍" },
      { key: "em_rota", label: "Em rota", icone: "🚚" },
      { key: "entregue", label: "Entregue", icone: "✅" },
    ];
    const idx = { pendente: 0, em_rota: 1, entregue: 2 }[status];
    return `<div class="progresso-entrega">
          ${passos
            .map((p, i) => {
              const cls = i < idx ? "concluido" : i === idx ? "ativo" : "";
              const linha =
                i < passos.length - 1
                  ? `<div class="passo-linha${i < idx ? " concluida" : ""}"></div>`
                  : "";
              return `<div class="passo-entrega ${cls}">
              <div class="passo-circulo">${p.icone}</div>
              <span>${p.label}</span>
            </div>${linha}`;
            })
            .join("")}
        </div>`;
  }

  // esse trecho filtra e mostra as entregas do painel
  function renderFiltros() {
    const container = document.getElementById("filtros-entregas");
    const opcoes = [
      { valor: "todas", label: "Todas ativas" },
      { valor: "pendente", label: "Aguardando" },
      { valor: "em_rota", label: "Em rota" },
    ];
    container.innerHTML = "";
    opcoes.forEach((op) => {
      const btn = document.createElement("button");
      btn.className = `filtro-doacao${filtroAtivo === op.valor ? " ativo" : ""}`;
      btn.textContent = `${op.label} (${contarPorStatus(op.valor)})`;
      btn.addEventListener("click", () => {
        filtroAtivo = op.valor;
        renderFiltros();
        renderEntregas();
      });
      container.appendChild(btn);
    });
  }

  function renderEntregas() {
    const container = document.getElementById("lista-minhas-entregas");
    const ativas = minhasEntregas.filter((e) => e.status !== "entregue");
    const badge = document.getElementById("badge-total-entregas");
    if (badge)
      badge.textContent = `${ativas.length} entrega${ativas.length !== 1 ? "s" : ""}`;

    const lista =
      filtroAtivo === "todas"
        ? ativas
        : ativas.filter((e) => e.status === filtroAtivo);

    container.innerHTML = "";

    if (lista.length === 0) {
      container.innerHTML = `<div class="sem-solicitacoes">📦 Nenhuma entrega ativa no momento. Veja as disponíveis abaixo!</div>`;
      return;
    }

    lista.forEach((e) => {
      const itensTexto = e.itens.map((i) => `${i.nome} ×${i.qtd}`).join(" · ");
      const pts = calcularPontos(e.distancia);
      const cfg = {
        pendente: {
          classe: "badge-entrega-pendente",
          icone: "⏳",
          label: "Aguardando",
        },
        em_rota: {
          classe: "badge-entrega-em-rota",
          icone: "🚚",
          label: "Em rota",
        },
        entregue: {
          classe: "badge-entrega-entregue",
          icone: "✅",
          label: "Entregue",
        },
      }[e.status];

      const acoes =
        e.status === "pendente"
          ? `<button class="btn-acao-entrega btn-retirar" onclick="confirmarRetirada(${e.id})">📦 Confirmar retirada</button>`
          : e.status === "em_rota"
            ? `<button class="btn-acao-entrega btn-confirmar-entrega" onclick="confirmarEntrega(${e.id})">✅ Confirmar entrega</button>`
            : "";

      const card = document.createElement("div");
      card.id = `card-e-${e.id}`;
      card.className = `card-entrega card-entrega-${e.status.replace("_", "-")} acordeon`;
      card.innerHTML = `
            <div class="acordeon-header" onclick="toggleAcordeon('card-e-${e.id}')">
              <div class="entrega-avatar">${e.iniciais}</div>
              <div class="acordeon-info">
                <strong>${e.beneficiario}</strong>
                <span>📍 ${e.endereco}</span>
              </div>
              <div class="acordeon-meta">
                <span class="badge-status-entrega ${cfg.classe}">${cfg.icone} ${cfg.label}</span>
                <span class="tag-pontos-entrega${e.status === "entregue" ? " ganho" : ""}">🪙 +${pts}</span>
                <span class="acordeon-data">${e.data.slice(0, 5)}</span>
                <span class="acordeon-seta">›</span>
              </div>
            </div>
            <div class="acordeon-body">
              ${buildProgressoHTML(e.status)}
              <div class="card-entrega-detalhe">
                <span class="card-entrega-ponto">🏪 ${e.ponto}</span>
                <span class="card-entrega-itens">${itensTexto}</span>
              </div>
              ${e.obs ? `<div class="card-entrega-obs">💬 ${e.obs}</div>` : ""}
              ${acoes ? `<div class="card-entrega-acoes">${acoes}</div>` : ""}
            </div>`;
      container.appendChild(card);
    });
  }

  window.toggleAcordeon = (id) => {
    const card = document.getElementById(id);
    if (card) card.classList.toggle("expandido");
  };

  function renderEntregasDisponiveis() {
    const container = document.getElementById("lista-entregas-disponiveis");
    if (!container) return;
    const badge = document.getElementById("badge-disp");
    if (badge)
      badge.textContent = `${entregasDisponiveis.length} disponíve${entregasDisponiveis.length !== 1 ? "is" : "l"}`;
    container.innerHTML = "";

    if (entregasDisponiveis.length === 0) {
      container.innerHTML = `<div class="sem-solicitacoes">🎉 Todas as entregas do dia já foram aceitas. Volte mais tarde!</div>`;
      return;
    }

    entregasDisponiveis.forEach((d) => {
      const pts = calcularPontos(d.distancia);
      const itensTexto = d.itens.map((i) => `${i.nome} ×${i.qtd}`).join(" · ");
      const card = document.createElement("div");
      card.className = "card-disp";
      card.innerHTML = `
            <div class="card-disp-bene">
              <div class="entrega-avatar">${d.iniciais}</div>
              <div class="entrega-bene-info">
                <strong>${d.beneficiario}</strong>
                <span>📍 ${d.endereco}</span>
              </div>
            </div>
            <div class="card-disp-meta">
              <span class="card-disp-ponto">🏪 ${d.ponto}</span>
              <span class="card-disp-dist">📌 ${d.distancia.toFixed(1).replace(".", ",")} km do ponto até o beneficiário</span>
              <span class="card-disp-itens">📦 ${itensTexto}</span>
            </div>
            <div class="card-disp-rodape">
              <span class="tag-pontos-disp">🪙 +${pts} pts ao concluir</span>
              <button class="btn-aceitar-entrega" onclick="aceitarEntrega(${d.id})">Aceitar entrega</button>
            </div>`;
      container.appendChild(card);
    });
  }

  window.aceitarEntrega = (id) => {
    const d = entregasDisponiveis.find((x) => x.id === id);
    const pts = calcularPontos(d.distancia);
    abrirModal({
      icone: "🚚",
      titulo: "Aceitar entrega",
      texto: `Aceitar entrega para ${d.beneficiario} partindo do ${d.ponto}? Você ganhará +${pts} pontos ao concluir!`,
      corBotao: "verde",
      onConfirmar: () => {
        entregasDisponiveis = entregasDisponiveis.filter((x) => x.id !== id);
        const hoje = new Date();
        const dataStr = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
        minhasEntregas.unshift({
          ...d,
          data: dataStr,
          obs: "",
          status: "pendente",
        });
        renderEntregasDisponiveis();
        renderFiltros();
        renderEntregas();
        atualizarContadores();
        adicionarNotificacao(
          "🚚",
          "Entrega aceita",
          `Retire os itens no ${d.ponto} e entregue a ${d.beneficiario}.`,
        );
        mostrarToast(
          `✅ Entrega aceita! Retire no ${d.ponto}. +${pts} pts ao concluir.`,
        );
      },
    });
  };

  window.confirmarRetirada = (id) => {
    const e = minhasEntregas.find((x) => x.id === id);
    abrirModal({
      icone: "📦",
      titulo: "Confirmar retirada",
      texto: `Confirmar que você retirou os itens para ${e.beneficiario} no ${e.ponto}?`,
      corBotao: "verde",
      onConfirmar: () => {
        e.status = "em_rota";
        atualizarContadores();
        renderFiltros();
        renderEntregas();
        mostrarToast(
          `✅ Retirada confirmada! Boa viagem até ${e.beneficiario}.`,
        );
      },
    });
  };

  window.confirmarEntrega = (id) => {
    const e = minhasEntregas.find((x) => x.id === id);
    const pts = calcularPontos(e.distancia);
    abrirModal({
      icone: "✅",
      titulo: "Confirmar entrega",
      texto: `Confirmar que os itens foram entregues a ${e.beneficiario}? Você ganhará +${pts} pontos!`,
      corBotao: "verde",
      onConfirmar: () => {
        e.status = "entregue";
        saldoPontos += pts;
        atualizarSaldoPontos();
        renderCupons();
        atualizarContadores();
        renderFiltros();
        renderEntregas();
        mostrarToast(
          `🎉 +${pts} pontos ganhos! Saldo: ${saldoPontos} pts. Obrigado, Ricardo!`,
        );
      },
    });
  };

  // esse trecho atualiza o sino e as notificações do voluntário
  let contadorNotif = 0;
  function adicionarNotificacao(icone, titulo, detalhe) {
    contadorNotif++;
    const badge = document.getElementById("badge-sino");
    badge.textContent = contadorNotif;
    badge.classList.add("visivel");
    const semNotif = document.getElementById("sem-notificacoes");
    if (semNotif) semNotif.remove();
    const lista = document.getElementById("lista-notificacoes");
    const item = document.createElement("div");
    item.className = "item-notificacao";
    item.innerHTML = `<span class="notif-icone">${icone}</span><div class="notif-texto"><strong>${titulo}</strong><span>${detalhe}</span></div>`;
    lista.prepend(item);
  }

  document.getElementById("sino").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("painel-notificacoes").classList.toggle("aberto");
  });

  document.addEventListener("click", () =>
    document.getElementById("painel-notificacoes").classList.remove("aberto"),
  );

  // esse trecho abre o perfil e as outras gavetas do painel
  const gavOv = document.getElementById("gaveta-overlay");

  function fecharTodasGavetas() {
    document
      .querySelectorAll(".gaveta-perfil.aberta")
      .forEach((g) => g.classList.remove("aberta"));
    gavOv.classList.remove("aberta");
    document.body.style.overflow = "";
  }

  function abrirGaveta(id) {
    fecharTodasGavetas();
    document.getElementById(id).classList.add("aberta");
    gavOv.classList.add("aberta");
    document.body.style.overflow = "hidden";
  }

  gavOv.addEventListener("click", fecharTodasGavetas);

  const camposEditaveis = [
    "gv-nome",
    "gv-telefone",
    "gv-disponibilidade",
    "gv-veiculo",
  ];
  let valoresOriginais = {};
  const btnEditar = document.getElementById("gaveta-btn-editar");
  const acoesEd = document.getElementById("gaveta-acoes-edicao");

  function sincronizarNome(nome) {
    const inicial = nome.charAt(0).toUpperCase();
    document.getElementById("gaveta-nome-exibido").textContent = nome;
    document.getElementById("gaveta-avatar").textContent = inicial;
    document.getElementById("avatar-inicial").textContent = inicial;
    document.getElementById("avatar-chip").textContent = inicial;
    document.getElementById("titulo-boas-vindas").textContent = `Olá, ${nome}!`;
    document.getElementById("nome-chip").textContent = nome;
  }

  sincronizarNome(document.getElementById("gv-nome").value);

  document.getElementById("btn-abrir-perfil").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta("gaveta-perfil");
  });
  document
    .getElementById("chip-usuario")
    .addEventListener("click", () => abrirGaveta("gaveta-perfil"));
  document
    .getElementById("gaveta-fechar")
    .addEventListener("click", fecharTodasGavetas);

  btnEditar.addEventListener("click", () => {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      valoresOriginais[id] = inp.value;
      inp.disabled = false;
    });
    btnEditar.style.display = "none";
    acoesEd.classList.add("visivel");
    document.getElementById("gv-nome").focus();
  });

  function sairModoEdicao(salvar) {
    camposEditaveis.forEach((id) => {
      const inp = document.getElementById(id);
      if (!salvar) inp.value = valoresOriginais[id] ?? inp.value;
      inp.disabled = true;
    });
    btnEditar.style.display = "";
    acoesEd.classList.remove("visivel");
  }

  document
    .getElementById("gaveta-btn-cancelar")
    .addEventListener("click", () => sairModoEdicao(false));
  document.getElementById("gaveta-btn-salvar").addEventListener("click", () => {
    sairModoEdicao(true);
    const novoNome = document.getElementById("gv-nome").value.trim();
    if (novoNome) sincronizarNome(novoNome);
    mostrarToast("✅ Perfil atualizado com sucesso!");
  });

  document.getElementById("btn-abrir-ajuda").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta("gaveta-ajuda");
  });
  document
    .getElementById("gaveta-ajuda-fechar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("gaveta-ajuda-cancelar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("gaveta-ajuda-enviar")
    .addEventListener("click", () => {
      const assunto = document.getElementById("sac-assunto").value;
      const mensagem = document.getElementById("sac-mensagem").value.trim();
      if (!assunto) {
        mostrarToast("⚠️ Selecione um assunto.");
        return;
      }
      if (!mensagem) {
        mostrarToast("⚠️ Escreva sua mensagem.");
        return;
      }
      document.getElementById("sac-assunto").value = "";
      document.getElementById("sac-mensagem").value = "";
      fecharTodasGavetas();
      mostrarToast("✅ Mensagem enviada! Retornaremos em até 2 dias úteis.");
    });

  document.getElementById("btn-ir-entregas").addEventListener("click", (e) => {
    e.preventDefault();
    document
      .getElementById("secao-minhas-entregas")
      .scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("btn-abrir-cupons").addEventListener("click", (e) => {
    e.preventDefault();
    abrirGaveta("gaveta-cupons");
    renderCupons();
  });
  document
    .getElementById("gaveta-cupons-fechar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("chip-pontos-display")
    .addEventListener("click", () => {
      abrirGaveta("gaveta-cupons");
      renderCupons();
    });

  document
    .getElementById("btn-abrir-certificado")
    .addEventListener("click", (e) => {
      e.preventDefault();
      abrirGaveta("gaveta-certificado");
      atualizarCertificado();
    });
  document
    .getElementById("gaveta-cert-fechar")
    .addEventListener("click", fecharTodasGavetas);
  document
    .getElementById("gaveta-cert-cancelar")
    .addEventListener("click", fecharTodasGavetas);
  document.getElementById("cert-nome-input").addEventListener("input", () => {
    const nomeEl = document.getElementById("cert-nome");
    if (nomeEl)
      nomeEl.textContent =
        document.getElementById("cert-nome-input").value || "Ricardo Lima";
  });
  document
    .getElementById("gaveta-cert-emitir")
    .addEventListener("click", () => {
      const nome = document.getElementById("cert-nome-input").value.trim();
      if (!nome) {
        mostrarToast("⚠️ Informe o nome para o certificado.");
        return;
      }
      fecharTodasGavetas();
      mostrarToast("✅ Certificado enviado para voluntario@voluntario.com!");
    });

  renderFiltros();
  renderEntregas();
  renderEntregasDisponiveis();
  atualizarContadores();
  renderCupons();
  atualizarSaldoPontos();
  atualizarCertificado();

  adicionarNotificacao(
    "🚚",
    "Nova entrega aceita",
    "Maria Silva aguarda seus itens do Ponto Centro.",
  );
  adicionarNotificacao(
    "📌",
    "5 entregas disponíveis",
    "Novas solicitações aguardando voluntário na sua região.",
  );
}
