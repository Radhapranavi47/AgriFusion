const translations = {
  en: {
    health: 'Health Status',
    risk: 'Risk Level',
    advisory: 'Advisory Recommendation',
    pestQuestion: 'Have you observed pests?',
    yellowQuestion: 'Are leaves turning yellow?',
    irrigationQuestion: 'Irrigation done recently?',
    // Voice advisory templates
    voiceHealth: 'Crop health status is',
    voiceRisk: 'Risk level is',
    voiceAdvisory: 'Advisory recommendation',
    healthy: 'Healthy',
    stressed: 'Stressed',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
  te: {
    health: 'పంట ఆరోగ్య స్థితి',
    risk: 'ప్రమాద స్థాయి',
    advisory: 'సిఫారసు',
    pestQuestion: 'కీటకాలు కనిపించాయా?',
    yellowQuestion: 'ఆకులు పసుపుగా మారుతున్నాయా?',
    irrigationQuestion: 'ఇటీవల నీరు పోశారా?',
    voiceHealth: 'పంట ఆరోగ్య స్థితి',
    voiceRisk: 'ప్రమాద స్థాయి',
    voiceAdvisory: 'సిఫారసు',
    healthy: 'ఆరోగ్యంగా ఉంది',
    stressed: 'ఒత్తిడితో ఉంది',
    low: 'తక్కువ',
    medium: 'మధ్యస్థ',
    high: 'అధిక',
  },
};

export const t = (language: string, key: string): string => {
  const dict = language in translations ? translations[language as keyof typeof translations] : translations.en;
  return (dict[key as keyof typeof dict] as string | undefined) || key;
};
