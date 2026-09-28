// Realistic Mock Job Source Generator for Offline/Dev/Demo Mode

import { JobSource, RawJob, JobSearchProfile, SearchContext, SourceHealth, SourceCapabilities } from '../../types';

export class MockJobSource implements JobSource {
  public id = 'mock';
  public name = 'JobRadar Mock Generator (Dev/Test Simulator)';
  public type = 'mock' as const;
  // Disabled by default in production so live discovery scans only crawl real company boards & APIs.
  // Activated only when mockOnly: true or MOCK_SOURCES=true is passed.
  public enabled = false;
  public priority = 'low' as const;

  public async search(_profile: JobSearchProfile, _context: SearchContext): Promise<RawJob[]> {
    const now = Date.now();
    const hours = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
    const days = (d: number) => new Date(now - d * 24 * 3600 * 1000).toISOString();

    const jobs: RawJob[] = [
      {
        source: 'mock',
        sourceJobId: 'nv-c-101',
        company: 'NVIDIA',
        companyDomain: 'nvidia.com',
        title: 'Senior Software Engineer – C++ & CUDA Acceleration',
        descriptionText: `NVIDIA is looking for a Senior C++ Engineer to develop high-performance compute engines, deep learning inference pipelines (TensorRT, ONNX), and GPU kernels.
Requirements:
- 4+ years of professional C++ development (C++17/20).
- Experience with CUDA, GPU acceleration, or Computer Vision.
- Strong background in Linux and systems programming.
- Familiarity with PyTorch or Deep Learning model optimization.`,
        location: ['Bengaluru, India', 'Remote'],
        isRemote: true,
        employmentType: 'full_time',
        seniority: 'senior',
        datePosted: hours(2),
        salaryMin: 4500000,
        salaryMax: 7000000,
        salaryCurrency: 'INR',
        applicationUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/India-Bangalore/Senior-C--Engineer',
        sourceUrl: 'https://nvidia.com/careers',
      },
      {
        source: 'mock',
        sourceJobId: 'ad-ml-202',
        company: 'Adobe',
        companyDomain: 'adobe.com',
        title: 'Machine Learning Engineer – Computer Vision & Creative AI',
        descriptionText: `Join the Adobe Firefly and Creative Cloud AI group. We are building state-of-the-art generative imaging and computer vision features.
Key qualifications:
- 3+ years experience building ML / Deep Learning applications with PyTorch.
- Experience with real-time image processing, OpenGL/GLSL shaders, and ONNX Runtime.
- Proficiency in Python and modern C++.
- Passion for cutting-edge generative models and consumer-scale media processing.`,
        location: ['Noida, India', 'Remote'],
        isRemote: true,
        employmentType: 'full_time',
        seniority: 'mid',
        datePosted: hours(5),
        salaryMin: 3500000,
        salaryMax: 5500000,
        salaryCurrency: 'INR',
        applicationUrl: 'https://adobe.wd5.myworkdayjobs.com/external_experienced/job/Noida/ML-Engineer-Computer-Vision',
        sourceUrl: 'https://adobe.com/careers',
      },
      {
        source: 'mock',
        sourceJobId: 'qc-cv-303',
        company: 'Qualcomm',
        companyDomain: 'qualcomm.com',
        title: 'Computer Vision & Edge AI Engineer',
        descriptionText: `Qualcomm AI Research is developing on-device neural processing engines for Snapdragon platforms.
Responsibilities:
- Optimize deep neural networks using TensorRT, MediaPipe, and Qualcomm Neural Processing SDK.
- Implement camera pipeline algorithms in C++ and Android NDK.
- Collaborate with hardware teams on low-latency inference benchmarks.`,
        location: ['Hyderabad, India', 'Bengaluru, India'],
        isRemote: false,
        employmentType: 'full_time',
        seniority: 'senior',
        datePosted: hours(8),
        salaryMin: 3200000,
        salaryMax: 5000000,
        salaryCurrency: 'INR',
        applicationUrl: 'https://qualcomm.wd5.myworkdayjobs.com/External/job/Hyderabad/Edge-AI-Engineer',
        sourceUrl: 'https://qualcomm.com/careers',
      },
      {
        source: 'mock',
        sourceJobId: 'str-404',
        company: 'Stripe',
        companyDomain: 'stripe.com',
        title: 'Staff Software Engineer – Core Systems',
        descriptionText: `Stripe's infrastructure powers hundreds of billions of dollars in global commerce.
Requirements:
- 6+ years experience in distributed systems, high-reliability infrastructure, and low-latency services.
- Proficiency in C++, Go, or Rust.
- Strong Linux networking, observability, and concurrency debugging expertise.`,
        location: ['Remote - Worldwide'],
        isRemote: true,
        employmentType: 'full_time',
        seniority: 'staff',
        datePosted: hours(11),
        salaryMin: 180000,
        salaryMax: 260000,
        salaryCurrency: 'USD',
        applicationUrl: 'https://stripe.com/jobs/listing/staff-software-engineer-core-systems',
        sourceUrl: 'https://stripe.com/jobs',
      },
      {
        source: 'mock',
        sourceJobId: 'sam-and-505',
        company: 'Samsung',
        companyDomain: 'samsung.com',
        title: 'Lead Android AI & Frameworks Engineer',
        descriptionText: `Samsung R&D Institute India (SRI-B) is seeking an experienced Android engineer to innovate Galaxy AI experiences.
Skills required:
- Android system development, Kotlin, Jetpack Compose, and Android NDK (C++).
- Integration of on-device ML models using ONNX, MediaPipe, and Tizen/Android graphics.
- OpenGL ES, Vulkan, or camera HAL experience is a major plus.`,
        location: ['Bengaluru, India'],
        isRemote: false,
        employmentType: 'full_time',
        seniority: 'lead',
        datePosted: days(1),
        salaryMin: 4000000,
        salaryMax: 6500000,
        salaryCurrency: 'INR',
        applicationUrl: 'https://samsung.wd3.myworkdayjobs.com/Samsung_Careers/job/Bengaluru/Lead-Android-AI-Engineer',
        sourceUrl: 'https://samsung.com/careers',
      },
      {
        source: 'mock',
        sourceJobId: 'goog-606',
        company: 'Google',
        companyDomain: 'google.com',
        title: 'Software Engineer III – Media & Perception Systems',
        descriptionText: `Google Core Systems team is building next-generation computer vision and media pipelines for Android and Pixel devices.
Minimum requirements:
- BS or MS in Computer Science or equivalent.
- 3+ years experience with C++, Python, and algorithm design.
- Hands-on experience with Computer Vision, OpenGL/GLSL, or machine learning pipelines.`,
        location: ['Bengaluru, India', 'Hyderabad, India'],
        isRemote: false,
        employmentType: 'full_time',
        seniority: 'mid',
        datePosted: days(1),
        salaryMin: 4200000,
        salaryMax: 6800000,
        salaryCurrency: 'INR',
        applicationUrl: 'https://careers.google.com/jobs/results/123456-software-engineer-media/',
        sourceUrl: 'https://careers.google.com',
      },
      {
        source: 'mock',
        sourceJobId: 'fig-707',
        company: 'Figma',
        companyDomain: 'figma.com',
        title: 'Software Engineer – Graphics & Engine Rendering',
        descriptionText: `Figma's editor runs on a custom WebGL and C++ rendering engine compiled to WebAssembly.
We are looking for an engineer to push the boundaries of real-time 2D/3D graphics performance.
Skills: C++, WebGL, OpenGL, GLSL, multi-threading, and systems optimization.`,
        location: ['Remote - US / Global'],
        isRemote: true,
        employmentType: 'full_time',
        seniority: 'mid',
        datePosted: days(2),
        salaryMin: 165000,
        salaryMax: 220000,
        salaryCurrency: 'USD',
        applicationUrl: 'https://boards.greenhouse.io/figma/jobs/789101',
        sourceUrl: 'https://figma.com/careers',
      },
      {
        source: 'mock',
        sourceJobId: 'meta-808',
        company: 'Meta',
        companyDomain: 'meta.com',
        title: 'Research Scientist – Computer Vision & PyTorch',
        descriptionText: `Reality Labs at Meta is inventing the future of augmented and virtual reality.
We are seeking an applied scientist with deep expertise in PyTorch, 3D computer vision, SLAM, and neural rendering.
Requires strong Python and C++ skills.`,
        location: ['Remote', 'Menlo Park, CA'],
        isRemote: true,
        employmentType: 'full_time',
        seniority: 'senior',
        datePosted: days(2),
        salaryMin: 190000,
        salaryMax: 275000,
        salaryCurrency: 'USD',
        applicationUrl: 'https://www.metacareers.com/jobs/987654',
        sourceUrl: 'https://metacareers.com',
      },
      {
        source: 'mock',
        sourceJobId: 'amd-909',
        company: 'AMD',
        companyDomain: 'amd.com',
        title: 'Senior Compiler & ML Optimization Engineer',
        descriptionText: `AMD ROCm software team is expanding its open-source AI acceleration stack.
Work on optimizing PyTorch and ONNX workloads on AMD Instinct accelerators using modern C++, LLVM, and Linux driver APIs.`,
        location: ['Bengaluru, India', 'Remote'],
        isRemote: true,
        employmentType: 'full_time',
        seniority: 'senior',
        datePosted: days(3),
        salaryMin: 3600000,
        salaryMax: 5800000,
        salaryCurrency: 'INR',
        applicationUrl: 'https://careers.amd.com/jobs/112233',
        sourceUrl: 'https://amd.com/careers',
      },
      {
        source: 'mock',
        sourceJobId: 'msft-1010',
        company: 'Microsoft',
        companyDomain: 'microsoft.com',
        title: 'Senior Applied AI Engineer – Azure Computer Vision',
        descriptionText: `Microsoft Azure AI Cognitive Services is looking for a Senior Applied Scientist / AI Engineer to scale multimodal vision models.
Required: 4+ years of PyTorch, Deep Learning, ONNX Runtime, and C#/C++ service integration.`,
        location: ['Hyderabad, India', 'Remote'],
        isRemote: true,
        employmentType: 'full_time',
        seniority: 'senior',
        datePosted: days(4),
        salaryMin: 4000000,
        salaryMax: 6200000,
        salaryCurrency: 'INR',
        applicationUrl: 'https://careers.microsoft.com/us/en/job/445566',
        sourceUrl: 'https://careers.microsoft.com',
      },
      {
        source: 'mock',
        sourceJobId: 'bad-sales-11',
        company: 'Acme Sales Corp',
        companyDomain: 'acmesales.com',
        title: 'Technical Sales Representative – Software Products',
        descriptionText: 'Sales position for enterprise software. Cold calling and outbound prospecting.',
        location: ['New Delhi, India'],
        isRemote: false,
        employmentType: 'full_time',
        seniority: 'mid',
        datePosted: days(5),
        applicationUrl: 'https://acmesales.com/jobs/sales-1',
        sourceUrl: 'https://acmesales.com',
      },
    ];

    return jobs;
  }

  public async healthCheck(): Promise<SourceHealth> {
    return {
      sourceId: this.id,
      name: this.name,
      status: 'healthy',
      lastRunAt: new Date().toISOString(),
      jobsFoundTotal: 11,
      avgLatencyMs: 15,
      rateLimitHits: 0,
      consecutiveFailures: 0,
    };
  }

  public getCapabilities(): SourceCapabilities {
    return {
      supportsPagination: false,
      supportsDateFilter: true,
      providesExactSalary: true,
      providesFullDescription: true,
      // 1000 req/min is an in-memory placeholder because the mock adapter executes locally in RAM in ~15ms with no network calls or external API rate limits.
      rateLimitPerMinute: 1000,
    };
  }
}
