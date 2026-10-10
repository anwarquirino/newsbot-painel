import type { ArticleStatus, LogStatus } from '@/lib/types';

export type DemoCategory =
  'Tecnologia' | 'Saúde' | 'Negócios' | 'Engenharia' | 'Direito' | 'Educação' | 'Gastronomia';

export interface SeedArticle {
  title: string;
  source: string;
  category: DemoCategory;
  sourceSummary: string;
}

export const SOURCE_DOMAINS: Record<string, string> = {
  TechCrunch: 'techcrunch.com',
  Canaltech: 'canaltech.com.br',
  Tecnoblog: 'tecnoblog.net',
  'Olhar Digital': 'olhardigital.com.br',
  'Google News Saúde': 'news.google.com/rss/articles',
  'Agência Brasil': 'agenciabrasil.ebc.com.br/saude/noticia',
  'Google News Negócios': 'news.google.com/rss/articles',
  Exame: 'exame.com/negocios',
  InfoMoney: 'infomoney.com.br/economia',
  'Engenharia 360': 'engenharia360.com',
  'Google Trends': 'trends.google.com/trending/story',
  Conjur: 'conjur.com.br',
  Migalhas: 'migalhas.com.br/quentes',
  Porvir: 'porvir.org',
  'Google News Educação': 'news.google.com/rss/articles',
  Panelinha: 'panelinha.com.br/blog',
};

export const WP_CATEGORY_IDS: Record<DemoCategory, number> = {
  Tecnologia: 3,
  Saúde: 5,
  Negócios: 7,
  Engenharia: 9,
  Direito: 11,
  Educação: 13,
  Gastronomia: 15,
};

export const TAG_POOLS: Record<DemoCategory, string[]> = {
  Tecnologia: [
    'tecnologia',
    'inteligência artificial',
    'inovação',
    'startups',
    'segurança digital',
    'telecom',
    'aplicativos',
  ],
  Saúde: ['saúde', 'sus', 'vacinas', 'pesquisa', 'bem-estar', 'epidemiologia', 'medicina'],
  Negócios: [
    'economia',
    'mercado',
    'investimentos',
    'empresas',
    'varejo',
    'agronegócio',
    'emprego',
  ],
  Engenharia: [
    'engenharia',
    'infraestrutura',
    'energia',
    'construção civil',
    'sustentabilidade',
    'mobilidade',
  ],
  Direito: ['direito', 'legislação', 'stf', 'justiça', 'lgpd', 'trabalho'],
  Educação: ['educação', 'ensino', 'enem', 'universidade', 'professores', 'tecnologia educacional'],
  Gastronomia: ['gastronomia', 'culinária', 'nordeste', 'restaurantes', 'receitas', 'alagoas'],
};

export const SUMMARY_CLOSERS: Record<DemoCategory, string> = {
  Tecnologia: 'Entenda o que muda para usuários e empresas.',
  Saúde: 'Veja o que dizem os especialistas e como se proteger.',
  Negócios: 'Saiba como a decisão afeta o bolso e o mercado.',
  Engenharia: 'Conheça os detalhes técnicos e o cronograma previsto.',
  Direito: 'Entenda os efeitos práticos da decisão.',
  Educação: 'Veja o impacto para alunos, professores e redes de ensino.',
  Gastronomia: 'Descubra onde provar e o que torna a receita especial.',
};

export const CONTEXT_SENTENCES: Record<DemoCategory, string[]> = {
  Tecnologia: [
    'O anúncio foi feito nesta semana e repercutiu rapidamente entre desenvolvedores e analistas do setor.',
    'A novidade chega em um momento de disputa acirrada por participação de mercado e atenção dos usuários.',
    'Especialistas em tecnologia avaliam que a medida pode acelerar a adoção de soluções semelhantes no Brasil.',
  ],
  Saúde: [
    'Os dados foram divulgados por autoridades sanitárias e consolidam informações de todo o país.',
    'Profissionais de saúde acompanham o tema com atenção e reforçam a importância da prevenção.',
    'O levantamento considera registros oficiais e reforça tendências observadas nos últimos meses.',
  ],
  Negócios: [
    'A notícia movimentou o mercado financeiro e já é discutida por analistas e investidores.',
    'O cenário econômico recente ajuda a explicar a decisão e as expectativas para os próximos trimestres.',
    'Segundo o anúncio, os efeitos devem ser sentidos de forma gradual ao longo do próximo ano.',
  ],
  Engenharia: [
    'O projeto envolve equipes multidisciplinares e tecnologias que ainda são pouco comuns no país.',
    'A iniciativa é acompanhada de perto por universidades e órgãos reguladores do setor.',
    'Os responsáveis destacam ganhos de eficiência, segurança e redução de custos a longo prazo.',
  ],
  Direito: [
    'A decisão cria um precedente relevante e deve orientar casos semelhantes nos tribunais.',
    'Advogados e entidades de classe divergem sobre o alcance da medida na prática.',
    'O texto foi debatido por meses e recebeu contribuições de diferentes setores da sociedade.',
  ],
  Educação: [
    'A medida integra um conjunto de ações voltadas à melhoria dos indicadores educacionais.',
    'Gestores de redes públicas e privadas já se organizam para adaptar o calendário escolar.',
    'Pesquisadores apontam que o resultado reflete mudanças estruturais nas políticas de ensino.',
  ],
  Gastronomia: [
    'A cena gastronômica da região vive um momento de reconhecimento nacional e internacional.',
    'Chefs e produtores locais celebram a valorização de ingredientes típicos e técnicas tradicionais.',
    'O público respondeu com casas lotadas e filas que se repetiram ao longo de toda a semana.',
  ],
};

export const DETAIL_SENTENCES = [
  'As informações completas, incluindo prazos e critérios, foram publicadas na fonte original.',
  'Ainda não há definição sobre todos os detalhes, mas novas etapas devem ser anunciadas em breve.',
  'Os números apresentados são preliminares e podem ser revisados nas próximas semanas.',
];

export const IMPACT_BULLETS: Record<DemoCategory, string[]> = {
  Tecnologia: [
    'Usuários devem receber a novidade de forma gradual, começando por quem usa as versões mais recentes.',
    'Empresas precisam revisar integrações e políticas de privacidade para se adequar à mudança.',
    'A concorrência tende a responder com lançamentos semelhantes nos próximos meses.',
    'Desenvolvedores ganham novas ferramentas, mas também novas responsabilidades de segurança.',
  ],
  Saúde: [
    'A recomendação é procurar uma unidade de saúde ao notar os primeiros sintomas.',
    'Grupos prioritários devem ser atendidos primeiro, segundo o calendário oficial.',
    'A medida reduz a pressão sobre hospitais e amplia o acesso em regiões afastadas.',
    'Pesquisadores seguem monitorando os efeitos a longo prazo.',
  ],
  Negócios: [
    'Consumidores podem sentir o efeito nos preços já nos próximos meses.',
    'Pequenas e médias empresas são as mais sensíveis às mudanças anunciadas.',
    'Investidores reavaliam projeções de lucro e dividendos para o setor.',
    'A geração de empregos diretos e indiretos é um dos principais argumentos da proposta.',
  ],
  Engenharia: [
    'A obra deve reduzir o tempo de deslocamento e os custos logísticos na região.',
    'Novos materiais prometem maior durabilidade com menor impacto ambiental.',
    'A capacitação de mão de obra local faz parte do planejamento do projeto.',
    'O cronograma prevê etapas de testes antes da operação plena.',
  ],
  Direito: [
    'Empresas têm prazo para adequar contratos e políticas internas.',
    'Cidadãos ganham novos instrumentos para exigir seus direitos.',
    'A decisão pode ser revista em instâncias superiores, mas já produz efeitos imediatos.',
    'Especialistas recomendam acompanhar a regulamentação complementar.',
  ],
  Educação: [
    'Escolas precisam reorganizar turmas, horários e formação de professores.',
    'Estudantes de baixa renda são os principais beneficiados pela mudança.',
    'Os resultados devem aparecer nos indicadores oficiais a partir do próximo ciclo.',
    'A tecnologia entra como apoio, sem substituir o papel do professor.',
  ],
  Gastronomia: [
    'Restaurantes locais ganham visibilidade e novos públicos.',
    'Produtores da agricultura familiar são beneficiados pela demanda crescente.',
    'A receita pode ser reproduzida em casa com ingredientes simples.',
    'O turismo gastronômico se consolida como vetor econômico da região.',
  ],
};

export const CLOSING_SENTENCES = [
  'Acompanhe as próximas atualizações sobre o tema.',
  'Este conteúdo foi reescrito automaticamente a partir da matéria original.',
  'Saiba mais nos detalhes divulgados pela fonte.',
];

export const ERROR_MESSAGES = [
  'Groq API: 429 Too Many Requests após 3 tentativas (limite de tokens por minuto excedido)',
  'WordPress REST: 401 Unauthorized ao criar post (verifique a senha de aplicativo)',
  'Resposta da IA sem JSON válido: campo "conteudo" ausente na saída do modelo',
  'Timeout de 30s ao baixar o artigo original (ECONNRESET)',
  'WordPress REST: 500 Internal Server Error ao enviar imagem destacada',
  'Groq API: 503 Service Unavailable (modelo llama-3.3-70b indisponível)',
];

export const LOG_FLOWS = [
  'coleta_rss',
  'coleta_trends',
  'reescrita_ia',
  'publicacao_wp',
  'manutencao',
] as const;

export type LogFlow = (typeof LOG_FLOWS)[number];

export const LOG_FLOW_PATTERN: LogFlow[] = [
  'coleta_rss',
  'reescrita_ia',
  'publicacao_wp',
  'coleta_trends',
  'reescrita_ia',
  'publicacao_wp',
  'coleta_rss',
  'manutencao',
];

export const LOG_ERROR_INDEXES = new Set([2, 9, 13, 20, 24, 29, 33, 38]);

export const LOG_MESSAGES: Record<LogFlow, Record<LogStatus, string[]>> = {
  coleta_rss: {
    ok: [
      'Coleta concluída: 12 itens novos, 31 duplicados ignorados em 9 feeds',
      'Coleta concluída: 7 itens novos, 44 duplicados ignorados em 9 feeds',
      'Coleta concluída: 3 itens novos, 52 duplicados ignorados em 9 feeds',
    ],
    erro: [
      'Timeout de 30s ao ler o feed Canaltech; demais feeds processados',
      'Feed TechCrunch retornou XML inválido (linha 1, coluna 0)',
    ],
  },
  coleta_trends: {
    ok: [
      'Google Trends: 5 tendências novas para BR, 2 adicionadas à fila',
      'Google Trends: 8 tendências novas para BR, 3 adicionadas à fila',
    ],
    erro: ['Google Trends respondeu 429; nova tentativa agendada em 15 min'],
  },
  reescrita_ia: {
    ok: [
      'Artigo #%ID% reescrito em 14s (1.842 tokens)',
      'Artigo #%ID% reescrito em 21s (2.310 tokens)',
      'Artigo #%ID% reescrito em 9s (1.105 tokens)',
    ],
    erro: [
      'Groq API: 429 Too Many Requests no artigo #%ID%; item marcado como erro',
      'Resposta da IA sem JSON válido no artigo #%ID%; item marcado como erro',
    ],
  },
  publicacao_wp: {
    ok: [
      'Post criado no WordPress (ID %WP%) para o artigo #%ID%',
      'Post criado no WordPress (ID %WP%) com imagem destacada para o artigo #%ID%',
    ],
    erro: ['WordPress REST: 401 Unauthorized ao publicar o artigo #%ID%'],
  },
  manutencao: {
    ok: [
      'Limpeza: 0 itens em processando há mais de 10 min',
      'Limpeza: 1 item em processando há mais de 10 min devolvido à fila',
      'Backup lógico da tabela noticias_publicadas concluído (4,2 MB)',
    ],
    erro: ['Falha ao gravar backup: disco com menos de 5% livre'],
  },
};

export const STATUS_PLAN: Record<ArticleStatus, number> = {
  publicado: 36,
  fila: 13,
  processando: 3,
  erro: 6,
  descartado: 2,
};

export const SEED_ARTICLES: SeedArticle[] = [
  {
    title: 'Apple apresenta chip M5 com foco em IA local e autonomia de 24 horas',
    source: 'TechCrunch',
    category: 'Tecnologia',
    sourceSummary:
      'Novo processador promete executar modelos de linguagem no próprio dispositivo e dobrar a eficiência energética da geração anterior.',
  },
  {
    title: 'Nubank lança assistente financeiro com IA generativa para 100 milhões de clientes',
    source: 'Canaltech',
    category: 'Tecnologia',
    sourceSummary:
      'Ferramenta analisa gastos, sugere metas e responde dúvidas em linguagem natural dentro do aplicativo.',
  },
  {
    title: 'WhatsApp testa canais pagos com conteúdo exclusivo no Brasil',
    source: 'Tecnoblog',
    category: 'Tecnologia',
    sourceSummary:
      'Criadores poderão cobrar assinatura mensal por canais, com pagamento integrado ao Pix.',
  },
  {
    title: 'Starlink amplia cobertura e chega a 90% dos municípios brasileiros',
    source: 'Olhar Digital',
    category: 'Tecnologia',
    sourceSummary:
      'Expansão da internet via satélite foca em áreas rurais e na região Norte, com novos planos de entrada.',
  },
  {
    title: 'GitHub libera agentes de código autônomos para todos os planos',
    source: 'TechCrunch',
    category: 'Tecnologia',
    sourceSummary:
      'Agentes conseguem abrir pull requests, corrigir testes e responder revisões sem intervenção humana.',
  },
  {
    title: 'Anatel aprova regras para leilão de faixas 6 GHz destinadas ao Wi-Fi 7',
    source: 'Canaltech',
    category: 'Tecnologia',
    sourceSummary:
      'Edital deve ser publicado até o fim do ano e prevê contrapartidas de cobertura em escolas públicas.',
  },
  {
    title: 'OpenAI e Microsoft renegociam acordo de exclusividade na nuvem',
    source: 'TechCrunch',
    category: 'Tecnologia',
    sourceSummary:
      'Novo contrato permite que a OpenAI use outros provedores para treinamento de modelos de grande porte.',
  },
  {
    title: 'Pix automático completa um ano com 40 milhões de cobranças recorrentes',
    source: 'Tecnoblog',
    category: 'Tecnologia',
    sourceSummary:
      'Banco Central divulga balanço da modalidade e anuncia novas funções para assinaturas e contas de consumo.',
  },
  {
    title: 'Samsung revela tela dobrável em três partes em evento em Seul',
    source: 'Olhar Digital',
    category: 'Tecnologia',
    sourceSummary:
      'Protótipo abre em formato de tablet de 10 polegadas e deve chegar ao mercado em 2027.',
  },
  {
    title: 'Governo publica decreto que regulamenta data centers sustentáveis',
    source: 'Canaltech',
    category: 'Tecnologia',
    sourceSummary:
      'Texto cria incentivos fiscais para centros de dados que usem energia renovável e reúso de água.',
  },
  {
    title: 'Mozilla encerra suporte a versões antigas do Firefox no Windows 10',
    source: 'Tecnoblog',
    category: 'Tecnologia',
    sourceSummary:
      'Usuários receberão atualizações de segurança até março; depois disso, será preciso migrar de sistema.',
  },
  {
    title: 'Startup brasileira de baterias de sódio recebe aporte de R$ 300 milhões',
    source: 'TechCrunch',
    category: 'Tecnologia',
    sourceSummary:
      'Rodada liderada por fundo europeu financiará a primeira fábrica da empresa, em Camaçari (BA).',
  },
  {
    title: 'Google Fotos passa a identificar imagens geradas por IA com selo visível',
    source: 'Olhar Digital',
    category: 'Tecnologia',
    sourceSummary:
      'Recurso usa o padrão SynthID e mostra um aviso ao abrir a imagem no aplicativo.',
  },
  {
    title: 'Vazamento expõe dados de 2 milhões de clientes de operadora de telefonia',
    source: 'Canaltech',
    category: 'Tecnologia',
    sourceSummary:
      'Informações incluem CPF, endereço e histórico de faturas; ANPD abriu processo de apuração.',
  },
  {
    title: 'Anvisa aprova primeira vacina nacional contra a dengue em dose única',
    source: 'Google News Saúde',
    category: 'Saúde',
    sourceSummary:
      'Imunizante do Instituto Butantan protege contra os quatro sorotipos e deve entrar no calendário do SUS em 2027.',
  },
  {
    title: 'Estudo da USP associa sono irregular a maior risco de hipertensão',
    source: 'Agência Brasil',
    category: 'Saúde',
    sourceSummary:
      'Pesquisa acompanhou 15 mil adultos por oito anos e identificou aumento de 30% no risco entre quem varia muito o horário de dormir.',
  },
  {
    title: 'Ministério da Saúde amplia campanha de vacinação contra gripe para todas as idades',
    source: 'Agência Brasil',
    category: 'Saúde',
    sourceSummary:
      'Doses estarão disponíveis em todas as unidades básicas enquanto durarem os estoques.',
  },
  {
    title: 'Casos de coqueluche crescem 60% no Nordeste e acendem alerta',
    source: 'Google News Saúde',
    category: 'Saúde',
    sourceSummary:
      'Secretarias estaduais reforçam a vacinação de gestantes e crianças menores de um ano.',
  },
  {
    title: 'SUS passa a oferecer canetas emagrecedoras para pacientes com obesidade grave',
    source: 'Google News Saúde',
    category: 'Saúde',
    sourceSummary:
      'Protocolo define critérios de IMC e acompanhamento multiprofissional obrigatório.',
  },
  {
    title: 'Pesquisa da Fiocruz identifica nova variante do vírus sincicial respiratório',
    source: 'Agência Brasil',
    category: 'Saúde',
    sourceSummary:
      'Variante circula principalmente no Sul e não apresenta, até o momento, maior gravidade clínica.',
  },
  {
    title: 'Telemedicina responde por 15% das consultas no sistema privado',
    source: 'Google News Saúde',
    category: 'Saúde',
    sourceSummary:
      'Levantamento da ANS mostra crescimento constante desde a regulamentação definitiva da modalidade.',
  },
  {
    title: 'Maceió registra queda de 30% nos casos de dengue após uso do método Wolbachia',
    source: 'Agência Brasil',
    category: 'Saúde',
    sourceSummary:
      'Mosquitos com a bactéria foram liberados em 40 bairros da capital alagoana ao longo de dois anos.',
  },
  {
    title: 'Protetor solar com FPS acima de 50 tem eficácia questionada por dermatologistas',
    source: 'Google News Saúde',
    category: 'Saúde',
    sourceSummary:
      'Sociedade médica alerta que a reaplicação importa mais do que o fator e pede clareza nos rótulos.',
  },
  {
    title: 'Hospital de Alagoas realiza primeiro transplante de fígado do estado',
    source: 'Agência Brasil',
    category: 'Saúde',
    sourceSummary:
      'Procedimento foi feito em Maceió por equipe treinada em São Paulo; paciente passa bem.',
  },
  {
    title: 'Banco Central mantém Selic em 14,75% e sinaliza cortes em 2027',
    source: 'InfoMoney',
    category: 'Negócios',
    sourceSummary:
      'Comitê cita inflação de serviços persistente, mas vê espaço para afrouxamento gradual no próximo ano.',
  },
  {
    title: 'Petrobras anuncia investimento de US$ 5 bilhões em refinaria de Pernambuco',
    source: 'Exame',
    category: 'Negócios',
    sourceSummary:
      'Conclusão do segundo trem da Abreu e Lima deve dobrar a capacidade de refino no Nordeste.',
  },
  {
    title: 'Magazine Luiza fecha 80 lojas e aposta em marketplace',
    source: 'Google News Negócios',
    category: 'Negócios',
    sourceSummary:
      'Varejista concentra operação física em cidades médias e amplia a logística para vendedores parceiros.',
  },
  {
    title: 'Exportações do agronegócio batem recorde no primeiro semestre',
    source: 'Exame',
    category: 'Negócios',
    sourceSummary:
      'Soja, carne e café puxam resultado de US$ 92 bilhões, 11% acima do mesmo período do ano passado.',
  },
  {
    title: 'Fusão entre Azul e Gol recebe aval do Cade com restrições',
    source: 'InfoMoney',
    category: 'Negócios',
    sourceSummary:
      'Empresas terão de ceder slots em Congonhas e Santos Dumont para preservar a concorrência.',
  },
  {
    title: 'Inflação de alimentos desacelera e IPCA fecha setembro em 0,21%',
    source: 'Google News Negócios',
    category: 'Negócios',
    sourceSummary:
      'Queda nos preços de arroz, feijão e tomate compensa alta em combustíveis e passagens aéreas.',
  },
  {
    title: 'Reforma tributária: empresas terão até 2027 para se adaptar ao IBS',
    source: 'Exame',
    category: 'Negócios',
    sourceSummary:
      'Receita publica cronograma de transição e abre consulta pública sobre o sistema de notas fiscais.',
  },
  {
    title: 'Shein inaugura centro de distribuição em Guarulhos e promete entrega em 48 horas',
    source: 'Google News Negócios',
    category: 'Negócios',
    sourceSummary:
      'Galpão de 60 mil metros quadrados atenderá o Sudeste e deve gerar 1.500 empregos diretos.',
  },
  {
    title: 'Desemprego cai para 5,8% e atinge menor nível da série histórica',
    source: 'InfoMoney',
    category: 'Negócios',
    sourceSummary:
      'IBGE aponta recorde de pessoas ocupadas, mas renda média cresce abaixo da inflação.',
  },
  {
    title: 'Ambev testa cerveja com lúpulo cultivado no semiárido nordestino',
    source: 'Exame',
    category: 'Negócios',
    sourceSummary:
      'Projeto piloto em Petrolina usa irrigação de precisão e quer reduzir a importação do insumo.',
  },
  {
    title: 'Ponte estaiada sobre o Rio São Francisco entra na fase final de obras',
    source: 'Engenharia 360',
    category: 'Engenharia',
    sourceSummary:
      'Estrutura de 1,2 km ligará Alagoas e Sergipe e deve ser liberada ao tráfego no primeiro semestre.',
  },
  {
    title: 'Primeira usina de hidrogênio verde do Ceará começa a operar',
    source: 'Engenharia 360',
    category: 'Engenharia',
    sourceSummary:
      'Planta no Porto do Pecém produzirá 5 mil toneladas por ano com energia eólica e solar.',
  },
  {
    title: 'Engenheiros da UFAL desenvolvem concreto com resíduo de cana-de-açúcar',
    source: 'Google Trends',
    category: 'Engenharia',
    sourceSummary:
      'Cinza do bagaço substitui parte do cimento e reduz em 20% as emissões de carbono do material.',
  },
  {
    title: 'Metrô de São Paulo recebe trens autônomos na Linha 15-Prata',
    source: 'Engenharia 360',
    category: 'Engenharia',
    sourceSummary:
      'Composições sem condutor operam em intervalos de 90 segundos nos horários de pico.',
  },
  {
    title: 'Impressão 3D de casas populares chega a Alagoas em projeto piloto',
    source: 'Google Trends',
    category: 'Engenharia',
    sourceSummary:
      'Dez unidades de 45 metros quadrados serão erguidas em Arapiraca em menos de 30 dias.',
  },
  {
    title: 'Norma técnica de estruturas de madeira é atualizada após 30 anos',
    source: 'Engenharia 360',
    category: 'Engenharia',
    sourceSummary:
      'Nova ABNT NBR 7190 incorpora madeira engenheirada e critérios de desempenho ao fogo.',
  },
  {
    title: 'Parque eólico offshore no litoral do Rio Grande do Norte obtém licença prévia',
    source: 'Google Trends',
    category: 'Engenharia',
    sourceSummary: 'Primeiro projeto do tipo no país terá 60 turbinas e capacidade de 1 GW.',
  },
  {
    title: 'STF forma maioria para responsabilizar plataformas por conteúdo de terceiros',
    source: 'Conjur',
    category: 'Direito',
    sourceSummary:
      'Tese fixa dever de remoção após notificação extrajudicial em casos de crimes contra a honra.',
  },
  {
    title: 'Nova lei de proteção de dados de crianças entra em vigor',
    source: 'Migalhas',
    category: 'Direito',
    sourceSummary:
      'Plataformas devem verificar idade, desativar perfilamento e oferecer controles parentais por padrão.',
  },
  {
    title: 'TST decide que trabalho por aplicativo não configura vínculo empregatício',
    source: 'Conjur',
    category: 'Direito',
    sourceSummary:
      'Decisão em recurso repetitivo uniformiza o entendimento, mas ressalva casos com subordinação comprovada.',
  },
  {
    title: 'OAB aprova uso de inteligência artificial em petições com regras de transparência',
    source: 'Migalhas',
    category: 'Direito',
    sourceSummary:
      'Advogados deverão informar o uso da ferramenta e responder pela veracidade das citações.',
  },
  {
    title: 'Senado aprova marco legal dos jogos eletrônicos com incentivos fiscais',
    source: 'Migalhas',
    category: 'Direito',
    sourceSummary:
      'Texto reconhece o desenvolvimento de games como atividade cultural e segue para sanção.',
  },
  {
    title: 'CNJ regulamenta audiências virtuais permanentes em todo o país',
    source: 'Conjur',
    category: 'Direito',
    sourceSummary:
      'Partes poderão optar pelo formato remoto em qualquer instância, salvo decisão fundamentada do juiz.',
  },
  {
    title: 'Enem 2026 terá prova digital em 500 municípios',
    source: 'Porvir',
    category: 'Educação',
    sourceSummary:
      'Inep amplia a versão em computador e mantém a aplicação em papel para os demais candidatos.',
  },
  {
    title: 'MEC lança programa de alfabetização com tutoria por IA',
    source: 'Google News Educação',
    category: 'Educação',
    sourceSummary:
      'Plataforma gratuita acompanha a leitura em voz alta e sugere atividades personalizadas ao professor.',
  },
  {
    title: 'Universidades federais recebem R$ 2 bilhões para bolsas de permanência',
    source: 'Google News Educação',
    category: 'Educação',
    sourceSummary:
      'Recurso prioriza estudantes cotistas e cursos integrais, com reajuste de 25% no valor mensal.',
  },
  {
    title: 'Escolas de Alagoas adotam ensino integral em 70% da rede estadual',
    source: 'Porvir',
    category: 'Educação',
    sourceSummary:
      'Estado lidera o indicador no Nordeste e registra melhora no Ideb do ensino médio.',
  },
  {
    title: 'Pesquisa aponta que 40% dos professores usam IA para preparar aulas',
    source: 'Porvir',
    category: 'Educação',
    sourceSummary:
      'Levantamento ouviu 3 mil docentes e mostra uso concentrado em planejamento e correção de atividades.',
  },
  {
    title: 'Novo ensino médio: estados têm até dezembro para ajustar currículos',
    source: 'Google News Educação',
    category: 'Educação',
    sourceSummary:
      'Conselho Nacional de Educação publica diretrizes finais com carga horária mínima por área.',
  },
  {
    title: 'Cursos técnicos em tecnologia têm recorde de matrículas no Nordeste',
    source: 'Porvir',
    category: 'Educação',
    sourceSummary:
      'Institutos federais abrem 30 mil vagas em desenvolvimento de sistemas, redes e dados.',
  },
  {
    title: 'Cozinha nordestina ganha destaque no guia Michelin 2026',
    source: 'Panelinha',
    category: 'Gastronomia',
    sourceSummary:
      'Quatro restaurantes de Recife, Salvador e Maceió recebem estrelas na primeira edição que avalia a região.',
  },
  {
    title: 'Festival do Sururu movimenta orla de Maceió com 60 restaurantes',
    source: 'Google Trends',
    category: 'Gastronomia',
    sourceSummary:
      'Evento valoriza as marisqueiras da Lagoa Mundaú e espera receber 200 mil visitantes.',
  },
  {
    title: 'Chef alagoana vence prêmio internacional com receita de tapioca',
    source: 'Panelinha',
    category: 'Gastronomia',
    sourceSummary:
      'Prato combina goma de mandioca, queijo coalho e mel de abelha uruçu em competição realizada em Lima.',
  },
  {
    title: 'Cacau brasileiro supera o africano em concurso de chocolate em Paris',
    source: 'Google Trends',
    category: 'Gastronomia',
    sourceSummary: 'Amêndoas do sul da Bahia levam ouro em três categorias do Salon du Chocolat.',
  },
  {
    title: 'Café especial do Cerrado bate recorde de preço em leilão',
    source: 'Panelinha',
    category: 'Gastronomia',
    sourceSummary:
      'Lote de 10 sacas foi arrematado por comprador japonês por valor 40 vezes acima da cotação.',
  },
  {
    title: 'Restaurantes adotam cardápio dinâmico com preços ajustados por IA',
    source: 'Google Trends',
    category: 'Gastronomia',
    sourceSummary:
      'Sistema varia valores conforme horário e demanda; consumidores e Procon questionam transparência.',
  },
];
