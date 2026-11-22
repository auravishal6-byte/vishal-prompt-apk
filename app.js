document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const rawPromptInput = document.getElementById('raw-prompt');
  const modeSelect = document.getElementById('mode-select');
  const formatSelect = document.getElementById('format-select');
  const optimizeBtn = document.getElementById('optimize-btn');
  const outputWrapper = document.getElementById('output-wrapper');
  const outputText = document.getElementById('output-text');
  const copyBtn = document.getElementById('copy-btn');
  const copyText = document.getElementById('copy-text');
  const breakdownList = document.getElementById('breakdown-list');
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      if (rawPromptInput && text) { rawPromptInput.value = text; rawPromptInput.focus(); }
    });
  });
  const presetTemplates = {
    'code-review': {mode:'code',format:'markdown',prompt:'Perform a comprehensive code review on the code snippet provided below. Analyze it for memory efficiency, execution time complexity, edge cases, vulnerability vectors, and adherence to standard naming and architecture conventions.'},
    'deep-explain': {mode:'explain',format:'step-list',prompt:'Explain the concept of quantum key distribution using first principles. Break down the mathematical and physical mechanisms into progressive steps without using unnecessary high-level jargon, and provide a real-world application scenario.'},
    'bug-hunter': {mode:'reasoning',format:'markdown',prompt:'Act as an expert debugging software engineer. Help me isolate why my Node.js microservice experiences memory leaks under high concurrent load. Outline potential causes in order of probability and give diagnostic commands to test each hypothesis.'},
    'exec-summary': {mode:'concise',format:'table',prompt:'Summarize the strategic implications of adopting serverless architecture vs traditional Kubernetes clusters for an early-stage startup. Include a decision matrix with Cost, Latency, Maintenance, and Scalability.'}
  };
  document.querySelectorAll('.preset-card').forEach(card => {
    const btn = card.querySelector('.use-preset-btn');
    btn.addEventListener('click', () => {
      const data = presetTemplates[card.getAttribute('data-preset')];
      if (data) {
        if (modeSelect) modeSelect.value = data.mode;
        if (formatSelect) formatSelect.value = data.format;
        if (rawPromptInput) rawPromptInput.value = data.prompt;
        document.getElementById('optimizer')?.scrollIntoView({behavior:'smooth'});
      }
    });
  });
  function generateMasterPrompt(userPrompt, mode, format) {
    const cleanUserPrompt = userPrompt.trim();
    let persona = '', rules = [], formatInstruction = '', breakdownPoints = [];
    switch (mode) {
      case 'code': persona = 'You are a Principal Software Architect and Lead Engineer with 15+ years of production experience.'; rules = ['Provide clean, production-ready, modular, and fully typed code examples.','Include error handling, security constraints, and big-O time/space complexity notes.','Do not leave incomplete placeholders or unnecessary sample comments.']; breakdownPoints.push('<strong>Technical Persona:</strong> Enforces production-grade coding standards.','<strong>Security & Complexity Focus:</strong> Forces explicit memory and big-O checks.'); break;
      case 'reasoning': persona = 'You are an analytical researcher specializing in logic, first-principles analysis, and step-by-step problem decomposition.'; rules = ['Provide a concise, user-facing explanation of the key reasoning steps without revealing private internal chain-of-thought.','Identify potential hidden assumptions or logical fallacies before stating final answers.','Validate all claims with concrete logic or authoritative benchmarks.']; breakdownPoints.push('<strong>Reasoning Summary:</strong> Requests an understandable explanation of the approach.','<strong>Assumption Check:</strong> Flags edge cases and potential biases.'); break;
      case 'concise': persona = 'You are an Executive Chief of Staff delivering high-precision briefing notes to C-suite leadership.'; rules = ['Deliver direct, highly actionable facts with zero conversational introduction, fluff, or filler.','Use active voice, precise figures, and clear priority tagging.','Limit background fluff to maximum 2 sentences.']; breakdownPoints.push('<strong>Zero Fluff:</strong> Cuts greetings, repetitive context, and filler phraseology.','<strong>Executive Focus:</strong> Prioritizes actionable conclusions first.'); break;
      case 'explain': persona = 'You are an award-winning educator known for breaking down complex systems into intuitive visual metaphors.'; rules = ['Structure the explanation in 3 tiers: 1. Simple Analogy (EL5), 2. core Technical Mechanism, 3. Edge cases.','Use concrete real-world metaphors rather than abstract mathematical definitions.','Highlight common misconceptions at the end.']; breakdownPoints.push('<strong>Tiered Explanation:</strong> Builds understanding from intuitive analogy to technical depth.','<strong>Misconception Check:</strong> Directs attention to common traps.'); break;
      case 'creative': persona = 'You are a Senior Content Strategist and Creative Director specializing in high-converting narrative craft.'; rules = ["Adopt a vivid, engaging, and authoritative tone suitable for high-impact publication.","Avoid generic AI cliches (e.g., 'In conclusion', 'delve', 'tapestry', 'realm').",'Structure sections with strong hooks, clear thematic transitions, and call-to-action takeaways.']; breakdownPoints.push('<strong>Cliche Removal:</strong> Explicitly bans repetitive AI phrasing.','<strong>Narrative Hook:</strong> Demands compelling structural pacing.'); break;
      default: persona = 'You are an authoritative domain expert and fact-checking research intelligence assistant.'; rules = ['Rely strictly on established facts and verified principles. State clearly if certainty is low or data is insufficient.','Provide neutral, objective, and unbiased analysis without hallucinating or making speculative guesses.','Separate verified facts from consensus opinions.']; breakdownPoints.push('<strong>Hallucination Defense:</strong> Instructs model to declare uncertainty rather than guess.','<strong>Objective Grounding:</strong> Demands strict adherence to verifiable facts.');
    }
    switch (format) {
      case 'table': formatInstruction = 'Structure the primary analysis into a Markdown table with clearly labeled columns (e.g., Category | Details | Pros | Cons | Priority).'; breakdownPoints.push('<strong>Table Structure:</strong> Ensures visual comparative matrix.'); break;
      case 'json': formatInstruction = 'Output valid JSON data enclosed in a ```json code fence with clean key-value pairs and proper typing.'; breakdownPoints.push('<strong>Valid JSON Output:</strong> Enables machine-parsable response.'); break;
      case 'step-list': formatInstruction = 'Organize the response into an ordered, numbered step-by-step workflow (Step 1, Step 2, Step 3) with actionable sub-points.'; breakdownPoints.push('<strong>Numbered Plan:</strong> Creates an easy-to-follow execution roadmap.'); break;
      default: formatInstruction = 'Format the response in clean Markdown using H2 (##) and H3 (###) headers, concise bullet points, and code blocks where applicable.'; breakdownPoints.push('<strong>Structured Markdown:</strong> Enhances readability on any screen.');
    }
    const masterPrompt = `[SYSTEM ROLE]\n${persona}\n\n[CORE TASK]\n${cleanUserPrompt}\n\n[EXECUTION CONSTRAINTS & RULES]\n${rules.map((rule,idx)=>`${idx+1}. ${rule}`).join('\\n')}\n\n[OUTPUT FORMAT]\n${formatInstruction}\n\n[NEGATIVE CONSTRAINTS]\n- Do NOT begin with conversational greetings (e.g., "Sure, I can help with that!").\n- Do NOT make assumptions without stating them clearly.\n- Do NOT include generic closing remarks or conversational fluff.\n- Return ONLY the requested factual content in the designated structure.`;
    return {masterPrompt,breakdownPoints};
  }
  const form = document.getElementById('optimizer-form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const userText = rawPromptInput.value.trim();
    if (!userText) { alert('Please enter a prompt to optimize!'); return; }
    const result = generateMasterPrompt(userText,modeSelect.value,formatSelect.value);
    outputText.textContent = result.masterPrompt;
    breakdownList.innerHTML = result.breakdownPoints.map(point=>`<li>${point}</li>`).join('');
    outputWrapper.classList.remove('hidden');
    outputWrapper.scrollIntoView({behavior:'smooth',block:'start'});
  });
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const textToCopy = outputText.textContent;
    if (!textToCopy) return;
    try { await navigator.clipboard.writeText(textToCopy); }
    catch (err) { const ta=document.createElement('textarea'); ta.value=textToCopy; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    copyText.textContent='Copied!'; copyBtn.style.background='#10B981'; copyBtn.style.color='#FFFFFF';
    setTimeout(()=>{copyText.textContent='Copy Prompt';copyBtn.style.background='';copyBtn.style.color='';},2000);
  });
});