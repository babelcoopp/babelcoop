/* Monta prototipo/midia/pecas/pecas.json a partir dos arquivos prontos e dos MANIFESTO.jsonl
   (docs/design/assets/raw/<modelo>/<data>/): cada peça leva as predições que a fizeram, com id, custo e tempo.
   Uso (da raiz): node .deus/terminal-ao-vivo/evidencias/pecas/montar-pecas.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { lerManifestos, medirGlb, lerPng } from '/Users/matheussilveirapro/Desktop/babel-coop/app/scripts/gera-replicate.mjs';

const RAIZ = '/Users/matheussilveirapro/Desktop/babel-coop';
const PASTA = path.join(RAIZ, 'prototipo/midia/pecas');
const RODADA = 'terminal-ao-vivo-pecas';

/* nomes humanos e o que cada peça é: SUPABASE_PECAS.md §A e MAQUINA_PECAS.md §4 */
const PECAS = [
  ['gaveta', 'Gaveta', 'tabela: guarda linhas de uma coisa (pacientes, pedidos); vitrine (view) e janela (tabela estrangeira) são variantes dela', 'guarda as linhas (tabela)', 'guarda os Pacientes', 'dados'],
  ['campo', 'Campo', 'coluna: cada informação da gaveta, com o tipo (texto, data, ligação, vetor, lugar)', 'cada informação (coluna)', 'nome (texto) · nascimento (data) · clínica (ligação)', 'dados'],
  ['fio', 'Fio', 'chave estrangeira: liga uma gaveta à outra e diz o que acontece ao apagar', 'liga uma gaveta à outra', 'cada Agendamento pertence a um Paciente', 'dados'],
  ['chave', 'Chave', 'política de acesso (RLS): o cadeado na frente da gaveta decide quem vê e quem muda', 'quem vê e quem muda (RLS)', 'cada empresa vê só o seu', 'acesso'],
  ['empresa', 'Empresa', 'separação por cliente (tenant): tudo dentro da bandeja é de uma empresa só', 'cada empresa vê só o seu', 'tudo aqui dentro é separado por empresa', 'acesso'],
  ['portaria', 'Portaria', 'login (Auth): jeitos de entrar, papéis, crachá, senha e sessão', 'quem entra (login)', 'entra com e-mail e senha; papéis: dono, atendente', 'acesso'],
  ['porta', 'Porta', 'rota de API ou função na borda (Edge Function): recebe um pedido e grava', 'recebe pedidos (API)', 'recebe "novo agendamento" e grava na gaveta Agendamentos', 'movimento'],
  ['robo', 'Robô', 'gatilho, agenda (pg_cron), webhook ou função: faz algo sozinho quando algo acontece', 'faz sozinho quando algo acontece', 'quando entra um Paciente, manda o WhatsApp', 'movimento'],
  ['deposito', 'Depósito', 'arquivos (Storage): prateleiras de fotos e documentos, públicas ou trancadas', 'guarda arquivos (Storage)', 'guarda as fotos dos pacientes · 1,2 GB', 'dados'],
  ['cofre', 'Cofre', 'segredos e variáveis de ambiente: mostra quais chaves faltam, nunca o valor', 'guarda os segredos', 'precisa de: SUPABASE_URL, ZAPI_TOKEN', 'acesso'],
  ['tela', 'Tela', 'página do frontend: o que a pessoa vê e usa', 'a página que a pessoa usa', 'a tela Agenda usa a porta "listar agendamentos"', 'frente'],
  ['cano', 'Cano', 'tempo real (Realtime) e filas: leva a mudança até a tela na hora', 'avisa na hora (tempo real)', 'cada mudança em Agendamentos avisa a tela na hora', 'movimento'],
  ['armario', 'Armário', 'schema: onde as gavetas ficam; o da frente tem porta na rua, o dos fundos só o sistema abre', 'onde as gavetas ficam (schema)', 'esta gaveta tem porta na rua', 'dados'],
  ['ferramenta', 'Ferramenta', 'extensão do Postgres (pgvector, PostGIS, pg_cron…): dá uma habilidade nova à máquina', 'uma habilidade nova (extensão)', 'a máquina sabe procurar por parecido', 'dados'],
  ['carteiro', 'Carteiro', 'remetente de e-mail e SMS (SMTP próprio ou hook): o que mais derruba um lançamento', 'manda e-mail e SMS', 'Carteiro de teste: 2 por hora, só para a equipe', 'acesso'],
  ['casa-de-maquinas', 'Casa de Máquinas', 'a infraestrutura: servidor, disco, cópias de segurança, réplicas, domínio e região', 'servidor, disco e backup', 'Small · 2 GB · São Paulo · backup diário 7 dias', 'chao'],
];
/* tipos que a Máquina do protótipo já usa (maquina.js): o id da peça é o mesmo */
const TIPOS_MAQUINA = ['gaveta', 'porta', 'robo', 'tela', 'portaria', 'empresa', 'deposito', 'cofre', 'cano'];
const PADRAO = { 'google/nano-banana-2': 0.067, 'bria/remove-background': 0.018, 'firtoz/trellis': 0.035, 'wan-video/wan-2.7-i2v': 0.5 };

/* o giro medido por calibrar-giro.cjs (vista do GLB igual ao PNG) sobrevive a cada remontagem */
const anterior = (() => { try { return JSON.parse(fs.readFileSync(path.join(PASTA, 'pecas.json'), 'utf8')); } catch { return { pecas: [] }; } })();
const giroDe = (id) => { const p = anterior.pecas.find((q) => q.id === id); return p && p.giro_graus != null ? p.giro_graus : 0; };
const linhas = lerManifestos(path.join(RAIZ, 'docs/design/assets/raw'));
const ok = (l) => l.id && ['succeeded'].includes(l.status);
function achar(nome) { const c = linhas.filter((l) => l.nome === nome && ok(l)); return c[c.length - 1] || null; }
function predicao(etapa, l) {
  if (!l) return null;
  const custo = Number(l.custo_usd) > 0 ? Number(l.custo_usd) : PADRAO[l.modelo] || 0;
  return { etapa, modelo: l.modelo, id: l.id, custo_usd: +custo.toFixed(3), custo_estimado: !(Number(l.custo_usd) > 0) || undefined, tempo_s: l.predict_time_s != null ? +Number(l.predict_time_s).toFixed(1) : null, rodada: l.rodada || 'design-2030', data: l.data || null };
}

const pecas = [];
for (const [id, nome, oque, curto, frase, grupo] of PECAS) {
  const png = id + '.png', glb = id + '.glb';
  if (!fs.existsSync(path.join(PASTA, png)) || !fs.existsSync(path.join(PASTA, glb))) { console.error('falta', id); continue; }
  const kf = achar(id + '-iso'), rec = achar(id === 'cofre' ? 'cofre-recorte' : id + '-iso-recorte'), tri = achar(id + '-3d');
  const preds = [predicao('keyframe', kf), predicao('recorte', rec), predicao('3d', tri)];
  const clipeArq = id + '-ganha-corpo.mp4';
  const clipeLinha = achar(id + '-ganha-corpo');
  if (clipeLinha) preds.push(predicao('clipe', clipeLinha));
  const g = medirGlb(fs.readFileSync(path.join(PASTA, glb)));
  const im = lerPng(fs.readFileSync(path.join(PASTA, png)));
  const mini = id + '-iso.png';
  pecas.push({
    id, nome, o_que_e: oque, curto, frase, grupo,
    tipo_maquina: TIPOS_MAQUINA.includes(id) ? id : null,
    png, png_lado: im.largura, mini: fs.existsSync(path.join(PASTA, mini)) ? mini : null,
    glb, glb_bytes: g.bytes, triangulos: g.triangulos, giro_graus: giroDe(id),
    clipe: fs.existsSync(path.join(PASTA, clipeArq)) ? clipeArq : null,
    custo_usd: +preds.filter(Boolean).reduce((s, p) => s + p.custo_usd, 0).toFixed(3),
    predicoes: preds.filter(Boolean),
  });
}
const daRodada = linhas.filter((l) => l.rodada === RODADA && l.id && l.status !== 'nao-criada');
const cat = {
  versao: 1,
  gerado_em: new Date().toISOString(),
  pipeline: 'google/nano-banana-2 (1K, bloco-base de ardósia do cofre, sem texto) → bria/remove-background → firtoz/trellis (seed 19770815) → gltfpack -si 0.5 (quantizado, sem decodificador) + textura JPEG + material sem metal',
  rodada: RODADA,
  custo_rodada_usd: +daRodada.reduce((s, l) => s + (Number(l.custo_usd) || 0), 0).toFixed(3),
  predicoes_rodada: daRodada.length,
  custo_total_usd: +pecas.reduce((s, p) => s + p.custo_usd, 0).toFixed(3),
  como_usar: 'BC.pecas (midia/pecas/pecas.js): carregar(), url(id, "png"|"glb"|"clipe"), peca(el, id, {estado}), ganharCorpo(el), abrir3d(el, id), carregarModelo(id), vitrine(el)',
  pecas,
};
fs.writeFileSync(path.join(PASTA, 'pecas.json'), JSON.stringify(cat, null, 1) + '\n');
console.log(JSON.stringify({ pecas: pecas.length, custo_total_usd: cat.custo_total_usd, custo_rodada_usd: cat.custo_rodada_usd, predicoes_rodada: cat.predicoes_rodada, faltam: PECAS.map((p) => p[0]).filter((id) => !pecas.some((q) => q.id === id)) }));
