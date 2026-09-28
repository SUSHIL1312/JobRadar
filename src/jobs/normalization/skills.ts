// Skill Normalization, Aliases, and Extraction

// Mapping from alias / variant to canonical skill name
export const SKILL_SYNONYMS: Record<string, string> = {
  'cpp': 'C++',
  'c++': 'C++',
  'c plus plus': 'C++',
  'c#': 'C#',
  'csharp': 'C#',
  'c sharp': 'C#',
  'python': 'Python',
  'python3': 'Python',
  'py': 'Python',
  'kotlin': 'Kotlin',
  'android': 'Android',
  'jetpack compose': 'Jetpack Compose',
  'compose': 'Jetpack Compose',
  'pytorch': 'PyTorch',
  'torch': 'PyTorch',
  'tensorflow': 'TensorFlow',
  'tf': 'TensorFlow',
  'computer vision': 'Computer Vision',
  'cv': 'Computer Vision',
  'machine learning': 'Machine Learning',
  'ml': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'dl': 'Deep Learning',
  'opengl': 'OpenGL',
  'glsl': 'GLSL',
  'vulkan': 'Vulkan',
  'directx': 'DirectX',
  'linux': 'Linux',
  'unix': 'Linux',
  'tizen': 'Tizen',
  'mediapipe': 'MediaPipe',
  'onnx': 'ONNX',
  'tensorrt': 'TensorRT',
  'cuda': 'CUDA',
  'c': 'C',
  'rust': 'Rust',
  'golang': 'Go',
  'go': 'Go',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'javascript': 'JavaScript',
  'js': 'JavaScript',
  'react': 'React',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'embedded': 'Embedded',
  'embedded systems': 'Embedded',
  'firmware': 'Firmware',
  'rtos': 'RTOS',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'aws': 'AWS',
  'gcp': 'GCP',
  'azure': 'Azure',
  'git': 'Git',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'sql': 'SQL',
  'sqlite': 'SQLite',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
};

// Canonical list of known skills
export const KNOWN_SKILLS = Array.from(new Set(Object.values(SKILL_SYNONYMS)));

export function canonicalizeSkill(skill: string): string {
  const normalized = skill.trim().toLowerCase();
  return SKILL_SYNONYMS[normalized] || skill.trim();
}

/**
 * Extracts matching canonical skills from text (title + description)
 */
export function extractSkills(text: string, candidateSkills?: string[]): string[] {
  const detected = new Set<string>();
  const lowerText = ` ${text.toLowerCase()} `;

  const targets = candidateSkills && candidateSkills.length > 0
    ? candidateSkills.map(s => canonicalizeSkill(s))
    : KNOWN_SKILLS;

  for (const skill of targets) {
    const canonical = canonicalizeSkill(skill);
    // Find aliases for this canonical skill
    const aliases = Object.entries(SKILL_SYNONYMS)
      .filter(([_, canon]) => canon.toLowerCase() === canonical.toLowerCase())
      .map(([alias]) => alias);

    // Always check the canonical itself too
    aliases.push(canonical.toLowerCase());

    for (const alias of aliases) {
      // Handle special characters like C++, C#, .NET in regex safely
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use negative lookaround to handle special characters like C++, C#, .NET as well as standard word boundaries
      const pattern = new RegExp(`(?<![a-zA-Z0-9_#+])${escaped}(?![a-zA-Z0-9_#+])`, 'i');

      if (pattern.test(lowerText)) {
        detected.add(canonical);
        break;
      }
    }
  }

  return Array.from(detected);
}
