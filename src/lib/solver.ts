export type Mode = "direct" | "eli5" | "quiz" | "hint";
export type InputType = "text" | "snip" | "image" | "pdf" | "video";

export interface QuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: number;
}

export interface GraphSpec {
  kind: "quadratic" | "linear";
  a: number; b: number; c: number;
  label: string;
  roots?: number[];
}

export interface SolveResult {
  answer: string;
  steps: string[];
  bullets?: string[];
  topic: string;
  route: string;
  routeDetail: string;
  isMath: boolean;
  usedBigModel: boolean;
  confidence: "high" | "medium" | "low";
  graph?: GraphSpec;
  desmosUrl?: string;
  quiz?: QuizQuestion[];
  hint?: string;
  hintLevel: number;
  hasMoreHints: boolean;
  citations: string[];
  detectedLanguage: string;
  credits: { big: number; math: number; ocr: number; video: number; pdf: number };
  mock: boolean;
}

const norm = (s: string) =>
  s.replace(/²/g, "^2").replace(/³/g, "^3").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s+/g, " ").trim();

function fmt(n: number): string {
  if (!isFinite(n)) return "—";
  const r = Math.round(n * 10000) / 10000;
  return Number.isInteger(r) ? String(r) : String(r);
}

/* Parse ax^2+bx+c from an expression (assumes =0 or numeric rhs already subtracted) */
function parseQuadratic(expr: string): { a: number; b: number; c: number } | null {
  const e = expr.replace(/\s/g, "").replace(/-/g, "+-");
  if (!/x\^2|x²/.test(expr) && !e.includes("x^2")) return null;
  let a = 0, b = 0, c = 0, found = false;
  for (const term of e.split("+").filter(Boolean)) {
    if (term.includes("x^2")) { const coef = term.replace("x^2", ""); a = coef === "" || coef === "+" ? 1 : coef === "-" ? -1 : parseFloat(coef); found = true; }
    else if (term.includes("x")) { const coef = term.replace("x", ""); b = coef === "" || coef === "+" ? 1 : coef === "-" ? -1 : parseFloat(coef); }
    else if (!isNaN(parseFloat(term))) c = parseFloat(term);
  }
  return found && a !== 0 ? { a, b, c } : null;
}

function parseLinear(eq: string): { a: number; b: number; rhs: number } | null {
  const m = eq.replace(/\s/g, "").match(/^(-?\d*\.?\d*)x([+-]\d+\.?\d*)?=(-?\d+\.?\d*)$/);
  if (!m) return null;
  const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : parseFloat(m[1]);
  if (!a) return null;
  return { a, b: m[2] ? parseFloat(m[2]) : 0, rhs: parseFloat(m[3]) };
}

function derivativeOf(expr: string): { original: string; result: string; steps: string[] } | null {
  const e = expr.replace(/.*?(d\/dx|derivative of|differentiate|find f'\(x\) for|f\(x\)\s*=)/i, "").replace(/\s/g, "").replace(/-/g, "+-");
  const terms: string[] = []; const steps: string[] = [];
  let any = false;
  for (const t of e.split("+").filter(Boolean)) {
    const mm = t.match(/^(-?\d*\.?\d*)x(?:\^(-?\d+))?$/);
    if (mm) {
      any = true;
      const coef = mm[1] === "" ? 1 : mm[1] === "-" ? -1 : parseFloat(mm[1]);
      const pow = mm[2] ? parseInt(mm[2]) : 1;
      const nc = coef * pow, np = pow - 1;
      terms.push(np === 0 ? fmt(nc) : np === 1 ? `${fmt(nc)}x` : `${fmt(nc)}x^${np}`);
      steps.push(`Power rule on ${t}: multiply by ${pow}, lower the power → ${terms[terms.length - 1]}`);
    } else if (!isNaN(parseFloat(t))) { steps.push(`Constant ${t} → derivative is 0`); }
  }
  if (!any) return null;
  return { original: expr, result: terms.join(" + ").replace(/\+ -/g, "− ") || "0", steps };
}

function safeArithmetic(expr: string): number | null {
  const e = expr.replace(/^(what is|calculate|compute|evaluate)\s+/i, "").replace(/\?$/, "").trim();
  if (!/^[\d\s+\-*/().%^]+$/.test(e) || !/\d/.test(e)) return null;
  try {
    const v = Function(`"use strict"; return (${e.replace(/\^/g, "**")})`)() as number;
    return typeof v === "number" && isFinite(v) ? v : null;
  } catch { return null; }
}

interface MathSolution { answer: string; steps: string[]; graph?: GraphSpec; eli5: string[]; hints: string[]; topic: string; quizSeed: (string | number)[] }

function solveMath(raw: string): MathSolution | null {
  const text = norm(raw);
  const lower = text.toLowerCase();

  // Derivative
  if (/derivative|d\/dx|differentiate/.test(lower)) {
    const d = derivativeOf(text);
    if (d) return { answer: `f′(x) = ${d.result}`, steps: d.steps, topic: "Calculus · Derivatives", eli5: ["A derivative asks: how fast is this changing?", "Trick: bring the power down, then make the power 1 smaller.", `Doing that gives: ${d.result}`], hints: ["Use the power rule: xⁿ becomes n·xⁿ⁻¹.", "Apply it term by term. Constants disappear."], quizSeed: ["derivative"] };
  }

  // Pythagoras
  const py = lower.match(/(?:sides?|legs?|a\s*=\s*)(\d+\.?\d*)\D+(\d+\.?\d*)/);
  if ((lower.includes("pythag") || lower.includes("hypotenuse")) && py) {
    const a = parseFloat(py[1]), b = parseFloat(py[2]), c = Math.sqrt(a * a + b * b);
    return { answer: `c = ${fmt(c)}`, steps: [`a² + b² = c²`, `${a}² + ${b}² = ${fmt(a * a + b * b)}`, `c = √${fmt(a * a + b * b)} = ${fmt(c)}`], topic: "Geometry · Pythagoras", eli5: ["In a right triangle, the two short sides team up.", "Square each one, add them together.", "The square root of that total is the long side."], hints: ["Which formula links all three sides of a right triangle?", "Square both legs and add them first."], quizSeed: ["pythagoras", a, b, fmt(c)] };
  }

  // Quadratic equation
  const eqParts = text.split("=");
  if (eqParts.length === 2 || /x\^2/.test(text)) {
    const rhsNum = eqParts[1] && !isNaN(parseFloat(eqParts[1])) ? parseFloat(eqParts[1]) : 0;
    const q = parseQuadratic(eqParts[0]);
    if (q) {
      const { a, b } = q; const c = q.c - rhsNum;
      const disc = b * b - 4 * a * c;
      const wantFactor = lower.includes("factor");
      if (disc < 0) {
        return { answer: "No real solutions (discriminant < 0)", steps: [`a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}`, `Discriminant b²−4ac = ${fmt(disc)}`, `Negative → the parabola never crosses the x-axis.`], topic: "Algebra · Quadratics", eli5: ["This curve floats above the ground line.", "It never touches it — so there is no answer on the number line."], hints: ["Compute b² − 4ac first. What sign is it?", "A negative discriminant means no real roots."], quizSeed: ["quadratic", a, b, c], graph: { kind: "quadratic", a, b, c, label: `y = ${fmt(a)}x² + ${fmt(b)}x + ${fmt(c)}` } };
      }
      const r1 = (-b + Math.sqrt(disc)) / (2 * a), r2 = (-b - Math.sqrt(disc)) / (2 * a);
      const steps = [`Read off: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}`, `Discriminant: b² − 4ac = ${fmt(b * b)} − ${fmt(4 * a * c)} = ${fmt(disc)}`, `x = (−b ± √${fmt(disc)}) / 2a`, r1 === r2 ? `x = ${fmt(r1)} (repeated root)` : `x = ${fmt(r1)}  or  x = ${fmt(r2)}`];
      if (wantFactor && Number.isInteger(r1) && Number.isInteger(r2)) steps.unshift(`Find two numbers that multiply to ${fmt(c)} and add to ${fmt(b)}: ${fmt(-r1)} and ${fmt(-r2)}`);
      return {
        answer: wantFactor && Number.isInteger(r1) && Number.isInteger(r2) ? `(x ${-r1 >= 0 ? "+" : "−"} ${fmt(Math.abs(-r1))})(x ${-r2 >= 0 ? "+" : "−"} ${fmt(Math.abs(-r2))}) = 0  →  x = ${fmt(r1)}, x = ${fmt(r2)}` : `x = ${fmt(r1)}, x = ${fmt(r2)}`,
        steps, topic: "Algebra · Quadratics",
        eli5: ["We are hunting for x-values that make this equal zero.", "Imagine a U-shaped curve. Where it crosses the ground line = answers.", `It crosses at x = ${fmt(r1)} and x = ${fmt(r2)}.`],
        hints: ["Try factoring: two numbers that multiply to c and add to b.", `Or use the quadratic formula with a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}.`],
        quizSeed: ["quadratic", a, b, c, fmt(r1), fmt(r2)],
        graph: { kind: "quadratic", a, b, c, label: `y = ${fmt(a)}x² + ${fmt(b)}x + ${fmt(c)}`, roots: [r1, r2] },
      };
    }
    const lin = parseLinear(text.replace(/solve( for x)?:?/i, ""));
    if (lin) {
      const x = (lin.rhs - lin.b) / lin.a;
      return { answer: `x = ${fmt(x)}`, steps: [`${fmt(lin.a)}x + ${fmt(lin.b)} = ${fmt(lin.rhs)}`, `Subtract ${fmt(lin.b)} from both sides: ${fmt(lin.a)}x = ${fmt(lin.rhs - lin.b)}`, `Divide by ${fmt(lin.a)}: x = ${fmt(x)}`], topic: "Algebra · Linear equations", eli5: ["Think of a balance scale — keep both sides equal.", "Undo the + first, then undo the ×.", `That leaves x = ${fmt(x)} alone.`], hints: ["Get x alone. Undo addition/subtraction first.", "Then divide both sides by the number in front of x."], quizSeed: ["linear", lin.a, lin.b, lin.rhs, fmt(x)], graph: { kind: "linear", a: 0, b: lin.a, c: lin.b, label: `y = ${fmt(lin.a)}x + ${fmt(lin.b)}`, roots: [x] } };
    }
  }

  const pct = lower.match(/(\d+\.?\d*)\s*(?:%|percent) of (\d+\.?\d*)/);
  if (pct) { const v = (parseFloat(pct[1]) / 100) * parseFloat(pct[2]); return { answer: fmt(v), steps: [`${pct[1]}% = ${parseFloat(pct[1]) / 100}`, `${parseFloat(pct[1]) / 100} × ${pct[2]} = ${fmt(v)}`], topic: "Numbers · Percentages", eli5: ["Percent means “out of 100”.", `Take ${pct[1]} slices out of every 100 of ${pct[2]}.`, `That gives ${fmt(v)}.`], hints: ["Convert the percent to a decimal first.", "“Of” in math usually means multiply."], quizSeed: ["percent", pct[1], pct[2], fmt(v)] }; }

  const sqrt = lower.match(/(?:sqrt|√)\s*\(?(\d+\.?\d*)\)?/);
  if (sqrt) { const v = Math.sqrt(parseFloat(sqrt[1])); return { answer: `√${sqrt[1]} = ${fmt(v)}`, steps: [`Find a number that multiplied by itself gives ${sqrt[1]}`, `${fmt(v)} × ${fmt(v)} = ${sqrt[1]}`], topic: "Numbers · Roots", eli5: ["A square root asks: what number, times itself, makes this?", `The answer here is ${fmt(v)}.`], hints: ["Which perfect squares sit near this number?"], quizSeed: ["sqrt", sqrt[1], fmt(v)] }; }

  const arith = safeArithmetic(text);
  if (arith !== null) return { answer: fmt(arith), steps: [`Evaluate inside brackets first, then × ÷, then + − (BODMAS/PEMDAS).`, `Result: ${fmt(arith)}`], topic: "Numbers · Arithmetic", eli5: ["Do the brackets first, like opening the smallest box first.", "Then times and divide, then plus and minus.", `You get ${fmt(arith)}.`], hints: ["What does BODMAS / PEMDAS say to do first?"], quizSeed: ["arithmetic", fmt(arith)] };

  return null;
}

/* ---------- Knowledge base for non-math topics ---------- */
interface Topic { keys: string[]; topic: string; direct: string; eli5: string[]; hints: string[]; quiz: QuizQuestion[] }
const KB: Topic[] = [
  { keys: ["photosynthesis"], topic: "Biology · Photosynthesis", direct: "Photosynthesis: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Plants convert sunlight, water and carbon dioxide into glucose (food) and oxygen, in chloroplasts.",
    eli5: ["Plants are like tiny chefs that cook their own food.", "Ingredients: sunlight, water from roots, air from leaves.", "The meal they make is sugar for energy.", "Oxygen is left over — that's the air we breathe!"],
    hints: ["What three ingredients does a plant need?", "Where in the cell does it happen? Think green."],
    quiz: [
      { q: "Where does photosynthesis happen in the plant cell?", options: ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"], answerIndex: 1, explanation: "Chloroplasts contain chlorophyll, the green pigment that captures light.", difficulty: 1 },
      { q: "Which gas do plants RELEASE during photosynthesis?", options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"], answerIndex: 2, explanation: "Oxygen is released as a by-product; CO₂ is taken in.", difficulty: 1 },
      { q: "What is the correct balanced equation?", options: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "CO₂ + H₂O → O₂ + H₂", "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", "6O₂ + 6H₂O → C₆H₁₂O₆"], answerIndex: 0, explanation: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.", difficulty: 2 },
      { q: "If a plant gets more light (up to a limit), the rate of photosynthesis…", options: ["Decreases", "Stays identical", "Increases", "Stops completely"], answerIndex: 2, explanation: "Light intensity is a limiting factor until something else becomes limiting.", difficulty: 3 },
    ] },
  { keys: ["gravity", "newton"], topic: "Physics · Gravity & Newton", direct: "Gravity is the attractive force between masses: F = G·m₁m₂/r². Newton's laws: (1) objects keep their motion unless a force acts, (2) F = ma, (3) every action has an equal, opposite reaction.",
    eli5: ["Gravity is like Earth giving everything a gentle hug downward.", "Bigger things hug stronger — that's why the Moon stays near us.", "Push something and it pushes back (Newton's 3rd law).", "Heavier push = faster speedup (F = ma)."],
    hints: ["Think about why things fall down, not sideways.", "Which law says force = mass × acceleration?"],
    quiz: [
      { q: "Newton's 2nd law is written as…", options: ["F = ma", "E = mc²", "V = IR", "P = mv only"], answerIndex: 0, explanation: "Force = mass × acceleration.", difficulty: 1 },
      { q: "A book sits still on a table. This best shows Newton's…", options: ["1st law (inertia)", "2nd law", "3rd law only", "Law of gravitation"], answerIndex: 0, explanation: "No net force → no change in motion.", difficulty: 2 },
      { q: "If distance between two masses doubles, gravitational force becomes…", options: ["Double", "Half", "One quarter", "Four times"], answerIndex: 2, explanation: "Inverse-square law: F ∝ 1/r², so 1/2² = 1/4.", difficulty: 3 },
    ] },
  { keys: ["water cycle", "evaporat", "condensat"], topic: "Earth Science · Water Cycle", direct: "Water cycle: evaporation (liquid→vapour) → condensation (vapour→clouds) → precipitation (rain/snow) → collection. Powered by the Sun; water is recycled, never created or destroyed.",
    eli5: ["The Sun heats puddles and oceans — water floats up as invisible steam.", "High up it's cold, so steam huddles into clouds.", "Clouds get heavy and drop rain or snow.", "Water gathers in rivers and seas — then it starts again!"],
    hints: ["What powers the whole cycle?", "Name the steps starting from a puddle on a sunny day."],
    quiz: [
      { q: "What powers the water cycle?", options: ["Wind", "The Sun", "The Moon", "Volcanoes"], answerIndex: 1, explanation: "Solar energy drives evaporation.", difficulty: 1 },
      { q: "Water vapour turning back into liquid droplets in clouds is called…", options: ["Evaporation", "Precipitation", "Condensation", "Runoff"], answerIndex: 2, explanation: "Condensation forms clouds.", difficulty: 1 },
      { q: "Which sequence is correct?", options: ["Rain → evaporation → condensation", "Evaporation → condensation → precipitation", "Condensation → evaporation → rain always", "Collection → clouds → sun"], answerIndex: 1, explanation: "Evaporate up, condense into clouds, precipitate down.", difficulty: 2 },
    ] },
  { keys: ["mitosis", "cell division", "meiosis"], topic: "Biology · Cell Division", direct: "Mitosis = one cell → two identical diploid daughter cells (growth & repair): Prophase → Metaphase → Anaphase → Telophase. Meiosis makes 4 non-identical haploid gametes for reproduction.",
    eli5: ["A cell copies its instruction book (DNA).", "Then it splits into two cells, each with a full copy.", "Your body does this to grow and heal cuts."],
    hints: ["Mitosis: how many daughter cells, and are they identical?", "PMAT — can you order the four stages?"],
    quiz: [
      { q: "Mitosis produces…", options: ["2 identical cells", "4 different cells", "1 cell", "8 cells"], answerIndex: 0, explanation: "Two genetically identical diploid cells.", difficulty: 1 },
      { q: "During metaphase, chromosomes…", options: ["Split apart", "Line up in the middle", "Disappear", "Form the nucleus"], answerIndex: 1, explanation: "They align on the cell's equator (metaphase plate).", difficulty: 2 },
      { q: "Meiosis is used for…", options: ["Healing wounds", "Growth", "Making gametes (sperm/egg)", "Photosynthesis"], answerIndex: 2, explanation: "Meiosis produces haploid sex cells.", difficulty: 2 },
    ] },
  { keys: ["world war", "ww2", "wwii", "second world war"], topic: "History · World War II", direct: "WWII (1939–1945): Axis (Germany, Italy, Japan) vs Allies (US, USSR, UK, others). Began with Germany's invasion of Poland (1 Sep 1939); ended 1945 — VE Day 8 May, VJ Day 2 Sep after atomic bombs and Japan's surrender.",
    eli5: ["A huge fight between two teams of countries.", "It started in 1939 when Germany attacked Poland.", "It ended in 1945. Many countries then made the UN to keep peace."],
    hints: ["Which invasion started it, and in what year?", "Name one Axis and one Allied power."],
    quiz: [
      { q: "WWII began in which year?", options: ["1914", "1939", "1941", "1945"], answerIndex: 1, explanation: "1 September 1939 — invasion of Poland.", difficulty: 1 },
      { q: "Which was an Axis power?", options: ["USA", "Britain", "Germany", "USSR"], answerIndex: 2, explanation: "Axis: Germany, Italy, Japan.", difficulty: 1 },
      { q: "The US entered WWII after which event?", options: ["D-Day", "Pearl Harbor attack", "Battle of Britain", "Fall of Berlin"], answerIndex: 1, explanation: "Japan attacked Pearl Harbor on 7 Dec 1941.", difficulty: 2 },
    ] },
  { keys: ["fraction"], topic: "Math · Fractions", direct: "A fraction a/b means a parts out of b equal parts. To add fractions: make denominators equal (common denominator), then add numerators. E.g. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.",
    eli5: ["A fraction is pizza slices: bottom number = total slices.", "Top number = slices you have.", "To add, first cut both pizzas into the same slice size."],
    hints: ["Can you add 1/2 + 1/3 directly? What must match first?", "Find a common denominator for 2 and 3."],
    quiz: [
      { q: "1/2 + 1/4 = ?", options: ["2/6", "3/4", "1/3", "2/4"], answerIndex: 1, explanation: "1/2 = 2/4, so 2/4 + 1/4 = 3/4.", difficulty: 1 },
      { q: "Which fraction is largest?", options: ["3/8", "1/2", "2/5", "1/3"], answerIndex: 1, explanation: "1/2 = 0.5, bigger than the others.", difficulty: 2 },
      { q: "2/3 × 3/4 = ?", options: ["5/7", "6/12 = 1/2", "8/9", "5/12"], answerIndex: 1, explanation: "Multiply tops (6) and bottoms (12) → 6/12 = 1/2.", difficulty: 2 },
    ] },
  { keys: ["ohm", "voltage", "circuit", "resistance"], topic: "Physics · Circuits & Ohm's Law", direct: "Ohm's law: V = IR (voltage = current × resistance). Series: resistances add. Parallel: 1/R = Σ1/Rᵢ, voltage equal across branches. Power P = VI.",
    eli5: ["Voltage is the push, current is the flowing water.", "Resistance is a narrow pipe slowing the flow.", "More push or a wider pipe = more flow."],
    hints: ["Write V = IR. Which two values do you have?", "Rearrange the triangle: I = V ÷ R."],
    quiz: [
      { q: "V = 12V, R = 4Ω. Current = ?", options: ["48A", "3A", "0.33A", "16A"], answerIndex: 1, explanation: "I = V/R = 12/4 = 3A.", difficulty: 1 },
      { q: "In a series circuit, current is…", options: ["Different everywhere", "The same everywhere", "Zero", "Doubled at each bulb"], answerIndex: 1, explanation: "One loop → same current throughout.", difficulty: 2 },
      { q: "Doubling resistance (same voltage) does what to current?", options: ["Doubles it", "Halves it", "No change", "Quadruples it"], answerIndex: 1, explanation: "I = V/R — inversely proportional.", difficulty: 2 },
    ] },
  { keys: ["shakespeare", "macbeth", "romeo", "hamlet"], topic: "Literature · Shakespeare", direct: "Key exam angle: ambition (Macbeth), fate vs free will (Romeo & Juliet), indecision & revenge (Hamlet). Quote to use: Macbeth — “I have no spur / To prick the sides of my intent, but only / Vaulting ambition.” Structure answers: point → quote → analysis → link.",
    eli5: ["Shakespeare's stories are about big feelings.", "Macbeth wants power so much it ruins him.", "Pick a feeling, find a quote that shows it, explain the words."],
    hints: ["Which theme fits your text: ambition, love, or revenge?", "One short quote, then zoom into one powerful word."],
    quiz: [
      { q: "“To be, or not to be” is from…", options: ["Macbeth", "Hamlet", "Othello", "King Lear"], answerIndex: 1, explanation: "Hamlet's famous soliloquy, Act 3.", difficulty: 1 },
      { q: "Macbeth's tragic flaw is best described as…", options: ["Jealousy", "Vaulting ambition", "Laziness", "Honesty"], answerIndex: 1, explanation: "His ambition, spurred by the witches and Lady Macbeth.", difficulty: 2 },
      { q: "Best essay structure?", options: ["Retell the story", "Point → quote → analyse → link", "Quotes only", "Opinion only"], answerIndex: 1, explanation: "PEEL structure earns analysis marks.", difficulty: 2 },
    ] },
];

function findTopic(text: string): Topic | null {
  const l = text.toLowerCase();
  return KB.find((t) => t.keys.some((k) => l.includes(k))) ?? null;
}

function keywords(text: string): string[] {
  const stop = new Set("what is the a an of in on to and or how why does do can you explain me this that with for from are was were be been it its".split(" "));
  return [...new Set(text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !stop.has(w)))].slice(0, 4);
}

function genericTopic(text: string): Topic {
  const kw = keywords(text);
  const focus = kw[0] ?? "this topic";
  const cap = focus.charAt(0).toUpperCase() + focus.slice(1);
  const snippet = text.length > 160 ? text.slice(0, 160) + "…" : text;
  return {
    keys: [], topic: kw.length ? `Study · ${cap}` : "General study",
    direct: `Key point from your snip: “${snippet}” — focus on ${kw.join(", ") || "the core idea"}. Break it into: what it is → why it matters → one example. That structure answers most exam prompts on this content.`,
    eli5: [`Let's shrink the big words. This is about ${focus}.`, `Imagine explaining ${focus} to a friend with one everyday example.`, `Find the one main idea first — details hang off it like branches.`, `Say it back in your own words. If you can, you've got it.`],
    hints: [`Underline the key term: what is ${focus}, in one line?`, `Ask: why does ${focus} matter? What does it cause or change?`],
    quiz: [
      { q: `What is the main idea of the snipped content about ${focus}?`, options: [`It presents the core idea of ${focus}`, "It is mostly unrelated filler", "It only lists page numbers", "It is a shopping list"], answerIndex: 0, explanation: "Always identify the central claim first, then supporting detail.", difficulty: 1 },
      { q: `Best next study step after reading about ${focus}?`, options: ["Memorise every word verbatim", "Restate it in your own words + one example", "Skip it", "Only highlight, never test yourself"], answerIndex: 1, explanation: "Self-explanation + examples is the strongest encoding strategy.", difficulty: 2 },
      { q: `If an exam asks “evaluate ${focus}”, you should…`, options: ["Only describe it", "Weigh strengths and limitations with evidence", "Write one sentence", "Copy the definition"], answerIndex: 1, explanation: "Evaluate = judgement backed by evidence on both sides.", difficulty: 3 },
    ],
  };
}

function mathQuiz(seed: (string | number)[]): QuizQuestion[] {
  if (seed[0] === "quadratic") {
    const [, a, b, c, r1, r2] = seed;
    return [
      { q: `For ${a}x² + ${b}x + ${c} = 0, what is the discriminant?`, options: [String(Number(b) ** 2 - 4 * Number(a) * Number(c)), String(Number(b) ** 2 + 4 * Number(a) * Number(c)), String(2 * Number(a) + Number(b)), String(Number(a) * Number(c))], answerIndex: 0, explanation: `b² − 4ac = ${Number(b) ** 2 - 4 * Number(a) * Number(c)}.`, difficulty: 1 },
      { q: "What are the solutions?", options: [`x = ${r1}, x = ${r2}`, `x = ${Number(r1) * -1}, x = ${Number(r2) * -1}`, "No real solutions", `x = ${r1} only`], answerIndex: 0, explanation: "From factoring or the quadratic formula.", difficulty: 2 },
      { q: "The sum of the roots of ax² + bx + c = 0 equals…", options: ["c/a", "−b/a", "b² − 4ac", "a + b"], answerIndex: 1, explanation: "Vieta's formulas: sum = −b/a, product = c/a.", difficulty: 3 },
      { q: "Where does the parabola cross the y-axis?", options: [`At y = ${c}`, "At y = 0 always", `At y = ${b}`, "It never crosses"], answerIndex: 0, explanation: "Set x = 0 → y = c.", difficulty: 2 },
    ];
  }
  if (seed[0] === "linear") {
    const [, a, b, rhs, x] = seed;
    return [
      { q: `First step to solve ${a}x + ${b} = ${rhs}?`, options: [`Subtract ${b} from both sides`, "Multiply everything by x", "Square both sides", "Add x to both sides"], answerIndex: 0, explanation: "Undo addition before division.", difficulty: 1 },
      { q: "What is x?", options: [String(x), String(Number(x) + 1), String(Number(rhs)), "Cannot be found"], answerIndex: 0, explanation: `x = (${rhs} − ${b}) / ${a} = ${x}.`, difficulty: 1 },
      { q: "Checking your answer means…", options: ["Guessing again", "Substituting x back into the original equation", "Asking a friend", "Rounding up"], answerIndex: 1, explanation: "Substitution verifies both sides balance.", difficulty: 2 },
    ];
  }
  return [
    { q: "Which order of operations is correct?", options: ["Brackets → Powers → ×÷ → +−", "+− first, then ×÷", "Left to right, no rules", "Powers last"], answerIndex: 0, explanation: "BODMAS / PEMDAS ordering.", difficulty: 1 },
    { q: "Best way to avoid sign errors?", options: ["Work faster", "Write one step per line and carry signs carefully", "Skip negative numbers", "Use a bigger pen"], answerIndex: 1, explanation: "One transformation per line prevents dropped signs.", difficulty: 2 },
    { q: "An answer check that always helps:", options: ["Estimate the size first, compare after", "Never check", "Only check units", "Rewrite the question"], answerIndex: 0, explanation: "Estimation catches magnitude mistakes instantly.", difficulty: 2 },
  ];
}

export function detectLanguageName(text: string): string {
  if (/[¿¡]|\b(qué|cómo|ecuación|gracias)\b/i.test(text)) return "Spanish";
  if (/\b(est|les|une|pourquoi|merci)\b/i.test(text)) return "French";
  if (/[äöüß]|\b(und|ist|wie|danke)\b/i.test(text)) return "German";
  if (/[\u4e00-\u9fff]/.test(text)) return "Chinese Simplified";
  if (/[\u3040-\u30ff]/.test(text)) return "Japanese";
  if (/[\u0600-\u06ff]/.test(text)) return "Arabic";
  if (/[\u0900-\u097f]/.test(text)) return "Hindi";
  if (/[\u0400-\u04ff]/.test(text)) return "Russian";
  return "English";
}

export function solve(rawInput: string, mode: Mode, opts: { showSteps?: boolean; hintLevel?: number; language?: string; inputType?: InputType; hasImage?: boolean; fileName?: string } = {}): SolveResult {
  const input = rawInput.trim();
  const inputType = opts.inputType ?? "text";
  const hintLevel = Math.min(Math.max(opts.hintLevel ?? 1, 1), 2);
  const detected = detectLanguageName(input);
  const math = solveMath(input);
  const isMathLike = !!math || /(=|x\^|\d\s*[+\-*/]\s*\d|derivative|integrate|solve|factor|equation|sqrt|√)/i.test(input);
  const topicEntry = !math ? findTopic(input) ?? genericTopic(input) : null;

  const isLong = input.length > 300 || inputType === "pdf";
  const usedBig = isLong && !math;
  let route = "Small AI · GPT-4o mini / Llama 3";
  let routeDetail = "Short, simple text → fast small model. No big-model credit used.";
  if (math) { route = "SymPy solver → Small AI explains"; routeDetail = "Math detected → symbolic solver first (free), LLM only formats steps."; }
  else if (opts.hasImage || inputType === "image") { route = "Gemini Flash Vision → OCR + answer"; routeDetail = "Image snip → vision model reads it. 1 OCR credit."; }
  else if (inputType === "video") { route = "YouTube transcript → chunked Q&A"; routeDetail = "Transcript pull is free — no video minutes consumed."; }
  else if (usedBig) { route = "Big LLM · GPT-4o / Claude Sonnet class"; routeDetail = "Long / complex content → chunked and sent to a big model. 1 big-model credit."; }

  const credits = { big: usedBig ? 1 : 0, math: math ? 1 : 0, ocr: opts.hasImage || inputType === "image" ? 1 : 0, video: inputType === "video" && !/youtube\.com|youtu\.be/i.test(input) ? 5 : 0, pdf: inputType === "pdf" ? 1 : 0 };

  const citations: string[] = [];
  if (inputType === "pdf") citations.push(`Source: ${opts.fileName || "uploaded PDF"} · p.1–2`, "Headings & page breaks preserved from extraction");
  if (inputType === "video") citations.push("Transcript segment · 00:42–02:15", "Topic segment · 02:15–04:30");

  const confidence: SolveResult["confidence"] = input.length < 4 ? "low" : math || (topicEntry && findTopic(input)) ? "high" : "medium";

  const base = { topic: math?.topic ?? topicEntry!.topic, route, routeDetail, isMath: isMathLike, usedBigModel: usedBig, confidence, citations, detectedLanguage: detected, credits, mock: !process.env.GEMINI_API_KEY, hintLevel, graph: math?.graph, desmosUrl: math?.graph ? `https://www.desmos.com/calculator` : undefined };

  if (mode === "quiz") {
    const quiz = math ? mathQuiz(math.quizSeed) : topicEntry!.quiz;
    return { ...base, answer: `Adaptive quiz ready — ${quiz.length} questions on ${base.topic}. Difficulty rises as you answer.`, steps: [], quiz, hasMoreHints: false };
  }
  if (mode === "hint") {
    const hints = math?.hints ?? topicEntry!.hints;
    return { ...base, answer: "", steps: [], hint: hints[hintLevel - 1] ?? hints[0], hasMoreHints: hintLevel < hints.length };
  }
  if (mode === "eli5") {
    const bullets = math?.eli5 ?? topicEntry!.eli5;
    return { ...base, answer: bullets.join(" "), steps: [], bullets, hasMoreHints: false };
  }
  // direct
  const answer = math?.answer ?? topicEntry!.direct;
  const steps = opts.showSteps ? math?.steps ?? ["Identify what's being asked.", "Pull the key fact / formula from the snip.", "Apply it, then state the result plainly."] : math && opts.showSteps === undefined ? [] : opts.showSteps ? math?.steps ?? [] : [];
  return { ...base, answer, steps: opts.showSteps ? steps : [], hasMoreHints: false };
}

/* Try real AI models with graceful cascading fallback:
   1. Google Gemini Flash (Vision + High accuracy study reasoning)
   2. OpenAI / OpenAI-compatible endpoint (GPT-4o / GPT-4o-mini / DeepSeek)
   3. Groq (Llama 3.1 8B instant)
   Never throws — falls back to smart local solver if APIs are unavailable.
*/
export async function maybeGemini(prompt: string, mode: Mode): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiModels = ["gemini-flash-latest", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"];
    for (const model of geminiModels) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Mode: ${mode} (direct=only direct answer without chit-chat, eli5=2-4 simple bullet points with analogies, hint=one helpful gentle hint without giving final solution). User Question: ${prompt}` }] }]
          }),
        });
        if (r.ok) {
          const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch {
        // try next model
      }
    }
  }

  // Fallback to OpenAI / OpenAI-compatible endpoint if configured
  const openAIKey = process.env.OPENAI_API_KEY;
  if (openAIKey) {
    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    const candidateModels = ["gpt-4o-mini", "gpt-4o", "deepseek-chat"];
    for (const model of candidateModels) {
      try {
        const r = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: `You are SolverBuddy study AI. Mode: ${mode} (direct=only direct answer without extra chat, eli5=2-4 simple bullets with friendly analogies, hint=gentle guidance without giving away the final answer).`
              },
              { role: "user", content: prompt }
            ],
            max_tokens: 600,
          }),
        });
        if (r.ok) {
          const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
          const text = j.choices?.[0]?.message?.content;
          if (text && !text.toLowerCase().includes("please check") && !text.toLowerCase().includes("invalid key")) {
            return text;
          }
        }
      } catch {
        // try next
      }
    }
  }

  // Fallback to Groq if configured
  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groq}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: `Mode: ${mode}. Answer strictly in that mode. Content: ${prompt}` }],
          max_tokens: 600,
        }),
      });
      if (r.ok) {
        const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
        return j.choices?.[0]?.message?.content ?? null;
      }
    } catch {
      // return null
    }
  }

  return null;
}
