// Lighthouse CI: mide 5 páginas tipo con los mínimos de blueprint/.../lighthouse-budget.json
const p = require('./blueprint/reformas-murcia/lighthouse-budget.json');

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/',
        'http://localhost/servicios/reforma-de-banos/',
        'http://localhost/reforma-de-banos/molina-de-segura/',
        'http://localhost/zonas/alcantarilla/',
        'http://localhost/contacto/',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: p.lighthouse_min.performance }],
        'categories:accessibility': ['error', { minScore: p.lighthouse_min.accessibility }],
        'categories:best-practices': ['error', { minScore: p.lighthouse_min['best-practices'] }],
        'categories:seo': ['error', { minScore: p.lighthouse_min.seo }],
        ...Object.fromEntries(Object.entries(p.metricas_max).map(([k, v]) => [k, ['warn', { maxNumericValue: v }]])),
      },
    },
    upload: { target: 'filesystem', outputDir: './qa/lighthouse' },
  },
};
