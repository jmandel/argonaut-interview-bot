# Deep Research Prompt: AI-Conducted Stakeholder Discovery Interviews

Use this prompt with a deep research tool (e.g., Claude, Gemini Deep Research, Perplexity) to explore best practices for building an AI interviewer that conducts stakeholder discovery conversations in technical/policy domains.

---

## Context

I'm building an AI-powered interviewer that conducts ~10-minute discovery conversations with stakeholders in a multi-party standards development process (specifically healthcare interoperability, but the principles generalize). Each participant has a different role (e.g., hospital IT, patient advocate, public health epidemiologist, app developer, privacy officer) and very different levels of technical sophistication about the topic.

The AI interviewer's job is to surface each participant's genuine positions, concerns, requirements, and tradeoffs — grounded in their actual experience, not hypothetical speculation. The results are synthesized across participants to find agreements, tensions, and open questions.

I have a working prototype but the interviews are failing in specific ways:
- The AI asks participants to speculate about other stakeholders' motivations or concerns (things outside their experience)
- It asks compound questions bundling multiple hypothetical scenarios
- It doesn't introduce itself or set expectations
- When participants push back ("that's a bad question"), it slightly rewords the same approach instead of genuinely recalibrating
- It lectures about the technical architecture instead of listening
- It frames questions in the spec designer's vocabulary rather than the participant's operational vocabulary
- It asks about artifact internals the participant will never control or influence

## Research Questions

Please investigate all of the following areas in depth, with citations and concrete examples where possible:

### 1. Qualitative Interview Methodology
- What do expert qualitative researchers (Steve Portigal, IDEO, Erika Hall, Nielsen Norman Group) say about how to open an interview? How do you build rapport in the first 60 seconds?
- What is the principle of "staying in the participant's lane" and how do skilled interviewers avoid asking people to speculate outside their expertise?
- How should an interviewer handle pushback gracefully — when the participant says "that's not a good question" or "I don't know that" or "you're asking me to guess"?
- What's the difference between empathetic discovery and adversarial challenging, and when is each appropriate?
- What does "one question at a time" really mean in practice, and what are the failure modes when it's violated?
- How do you calibrate question sophistication to the participant's actual expertise and vocabulary?

### 2. Stakeholder Discovery for Standards/Policy Design
- How do contextual inquiry (Beyer & Holtzblatt) and experience-grounded questioning work? What's the technique for asking about specific past incidents rather than hypotheticals?
- How does the "critical incident technique" work for surfacing real pain points vs. stated positions?
- How do "jobs to be done" interviews (Bob Moesta, Chris Spiek) apply to requirements discovery? What's the "switch interview" technique?
- How do you interview stakeholders with very different levels of technical sophistication about the same system?
- How do you surface genuine requirements vs. stated positions — getting past "what they say they want" to "what they actually need"?
- How do you explore tensions and tradeoffs WITHOUT asking participants to speculate about other parties? What techniques let you discover cross-stakeholder tensions from single-stakeholder interviews?
- What does requirements elicitation research say about common failure modes in stakeholder interviews?

### 3. AI-Conducted Interviews: Known Pitfalls and Design Patterns
- What does published research say about AI/LLM-conducted qualitative interviews? What works, what fails, what do participants find frustrating?
- What are the known failure modes of LLM interviewers: compound questions, leading questions, not listening, repeating the same approach, asking participants to speculate, info-dumping?
- What prompt engineering techniques actually work for making LLMs behave like skilled interviewers? What instructions tend to get ignored?
- How do you make an AI interviewer genuinely adaptive — changing strategy when a line of questioning isn't working?
- How do you prevent the AI from "lecturing" or showing off domain knowledge instead of listening?
- How should an AI interviewer introduce itself? Should it be transparent about being AI?
- How do you ground AI questions in the participant's previous answers rather than following a rigid script?

### 4. Interview Arc Design
- What does a well-structured 10-minute discovery interview look like, exchange by exchange?
- How do you earn the right to ask hard questions? What does "building up to tensions" look like in practice?
- When and how should you introduce new concepts the participant may not know about?
- How do you close an interview well — summarizing, checking, and leaving space for the participant's own framing?
- How do you handle the pacing tension between "cover the topics" and "follow the participant's thread"?

### 5. Archetype/Role-Specific Interview Calibration
- How should interview guidance differ for operational/frontline workers vs. executives vs. technical architects vs. policy experts?
- What does it mean to "meet them where they are" concretely — how do you describe the same system to a public health epidemiologist vs. an OAuth2 expert?
- How do you write per-role interview notes that help the interviewer ask good questions without biasing them toward architectural/design questions the participant can't answer?
- How should "areas to explore" be framed vs. "blind spots to probe" — what's the difference in the resulting interview quality?

## Desired Output Format

For each area, please provide:
1. **Key principles** — the 3-5 most important actionable rules
2. **Concrete examples** — what a good vs. bad version of this looks like in an actual interview exchange
3. **Sources** — who says this and where (books, papers, methods guides)
4. **Prompt implications** — how this translates into specific instructions for an AI system prompt

End with a **synthesized set of rules** (20-30 total) that could be directly encoded into an AI interviewer's system prompt, ordered by importance.
