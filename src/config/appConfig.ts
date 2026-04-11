import userConfig from "../../minimax.config.json";

type VoiceOption = {
  id: string;
  label: string;
};

type AppConfig = {
  apiBaseUrl: string;
  models: {
    chatDefault: string;
    chatOptions: string[];
    voiceModel: string;
    voiceDefault: string;
    voiceOptions: VoiceOption[];
    videoDefault: string;
    videoOptions: string[];
    imageDefault: string;
    imageOptions: string[];
    imageAspectRatios: string[];
    musicDefault: string;
    musicOptions: string[];
    tokenPlanStatusModels: string[];
  };
  audio: {
    voice: {
      sampleRate: number;
      bitrate: number;
      format: string;
      channel: number;
    };
    music: {
      sampleRate: number;
      bitrate: number;
      format: string;
    };
  };
};

type PartialAppConfig = Partial<{
  apiBaseUrl: string;
  models: Partial<AppConfig["models"]>;
  audio: Partial<{
    voice: Partial<AppConfig["audio"]["voice"]>;
    music: Partial<AppConfig["audio"]["music"]>;
  }>;
}>;

const defaultConfig: AppConfig = {
  apiBaseUrl: "https://api.minimaxi.com/v1",
  models: {
    chatDefault: "MiniMax-M2.7-highspeed",
    chatOptions: ["MiniMax-M2.7-highspeed"],
    voiceModel: "speech-2.8-hd",
    voiceDefault: "audiobook_male_1",
    voiceOptions: [
      { id: "audiobook_male_1", label: "男声 (青叔音)" },
      { id: "audiobook_male_2", label: "男声 (沉稳)" },
      { id: "audiobook_female_1", label: "女声 (温柔)" },
      { id: "audiobook_female_2", label: "女声 (甜美)" },
      { id: "male-qn-qingse", label: "青年男声" },
      { id: "female-shaonv", label: "少女音" }
    ],
    videoDefault: "MiniMax-Hailuo-2.3",
    videoOptions: ["MiniMax-Hailuo-02", "MiniMax-Hailuo-2.3", "MiniMax-Hailuo-2.3-Fast"],
    imageDefault: "image-01",
    imageOptions: ["image-01"],
    imageAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    musicDefault: "music-2.6",
    musicOptions: ["music-2.5", "music-2.6"],
    tokenPlanStatusModels: ["MiniMax-M2.7-highspeed"]
  },
  audio: {
    voice: {
      sampleRate: 32000,
      bitrate: 128000,
      format: "mp3",
      channel: 1
    },
    music: {
      sampleRate: 44100,
      bitrate: 256000,
      format: "mp3"
    }
  }
};

const normalizeConfig = (config: AppConfig): AppConfig => {
  const isAspectRatio = (value: string) => /^\d+:\d+$/.test(value.trim());
  const safeUrl = typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim().length > 0
    ? config.apiBaseUrl
    : defaultConfig.apiBaseUrl;
  const safeVoiceOptions = config.models.voiceOptions?.length ? config.models.voiceOptions : defaultConfig.models.voiceOptions;
  const safeVideoOptions = config.models.videoOptions?.length ? config.models.videoOptions : defaultConfig.models.videoOptions;
  const rawImageOptions = config.models.imageOptions?.length ? config.models.imageOptions : defaultConfig.models.imageOptions;
  const inferredImageAspectRatios = rawImageOptions.filter(isAspectRatio);
  const normalizedImageOptions = rawImageOptions.filter((item) => !isAspectRatio(item));
  const safeImageOptions = normalizedImageOptions.length ? normalizedImageOptions : defaultConfig.models.imageOptions;
  const safeImageAspectRatios = config.models.imageAspectRatios?.length
    ? config.models.imageAspectRatios
    : inferredImageAspectRatios.length
      ? inferredImageAspectRatios
      : defaultConfig.models.imageAspectRatios;
  const safeMusicOptions = config.models.musicOptions?.length ? config.models.musicOptions : defaultConfig.models.musicOptions;
  const safeChatOptions = config.models.chatOptions?.length ? config.models.chatOptions : defaultConfig.models.chatOptions;
  const safeTokenPlanStatusModels = (config.models.tokenPlanStatusModels ?? [])
    .map((model) => model.trim())
    .filter((model) => model.length > 0);

  return {
    ...config,
    apiBaseUrl: safeUrl,
    models: {
      ...config.models,
      chatDefault: safeChatOptions.includes(config.models.chatDefault) ? config.models.chatDefault : safeChatOptions[0],
      voiceDefault: safeVoiceOptions.some((v) => v.id === config.models.voiceDefault) ? config.models.voiceDefault : safeVoiceOptions[0].id,
      videoDefault: safeVideoOptions.includes(config.models.videoDefault) ? config.models.videoDefault : safeVideoOptions[0],
      imageDefault: safeImageOptions.includes(config.models.imageDefault) ? config.models.imageDefault : safeImageOptions[0],
      musicDefault: safeMusicOptions.includes(config.models.musicDefault) ? config.models.musicDefault : safeMusicOptions[0],
      chatOptions: safeChatOptions,
      voiceOptions: safeVoiceOptions,
      videoOptions: safeVideoOptions,
      imageOptions: safeImageOptions,
      imageAspectRatios: safeImageAspectRatios,
      musicOptions: safeMusicOptions,
      tokenPlanStatusModels: safeTokenPlanStatusModels.length > 0 ? safeTokenPlanStatusModels : [safeChatOptions[0]]
    }
  };
};

const typedUserConfig = userConfig as PartialAppConfig;

const mergedConfig: AppConfig = {
  ...defaultConfig,
  ...typedUserConfig,
  models: {
    ...defaultConfig.models,
    ...typedUserConfig.models,
    chatOptions: typedUserConfig.models?.chatOptions?.length ? typedUserConfig.models.chatOptions : defaultConfig.models.chatOptions,
    voiceOptions: typedUserConfig.models?.voiceOptions?.length ? typedUserConfig.models.voiceOptions : defaultConfig.models.voiceOptions,
    videoOptions: typedUserConfig.models?.videoOptions?.length ? typedUserConfig.models.videoOptions : defaultConfig.models.videoOptions,
    imageOptions: typedUserConfig.models?.imageOptions?.length ? typedUserConfig.models.imageOptions : defaultConfig.models.imageOptions,
    imageAspectRatios: typedUserConfig.models?.imageAspectRatios?.length ? typedUserConfig.models.imageAspectRatios : defaultConfig.models.imageAspectRatios,
    musicOptions: typedUserConfig.models?.musicOptions?.length ? typedUserConfig.models.musicOptions : defaultConfig.models.musicOptions,
    tokenPlanStatusModels: typedUserConfig.models?.tokenPlanStatusModels?.length ? typedUserConfig.models.tokenPlanStatusModels : defaultConfig.models.tokenPlanStatusModels
  },
  audio: {
    voice: {
      ...defaultConfig.audio.voice,
      ...typedUserConfig.audio?.voice
    },
    music: {
      ...defaultConfig.audio.music,
      ...typedUserConfig.audio?.music
    }
  }
};

export const appConfig = normalizeConfig(mergedConfig);
export type { AppConfig, VoiceOption };
