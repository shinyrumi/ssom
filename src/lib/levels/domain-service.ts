import { buildProfileSnapshot, calculateProgress, evaluateUnlock, ProfileFieldsPayload } from './service';
import { LevelServiceAPI, LevelServiceDependencies, ProfileSnapshot } from './types';
import { ProfileLevelRecord } from './ports';

export function createLevelService(deps: LevelServiceDependencies): LevelServiceAPI {
  return {
    async unlock(attempt) {
      const result = evaluateUnlock(attempt);
      if (result.success) {
        await deps.levelRepo.saveUnlock(result, attempt);
      }
      return result;
    },
    async viewSnapshot({ profileId, viewerId, targetId }) {
      const [viewerLevel, targetLevel, profileLevels, rawProgress] = await Promise.all([
        deps.levelRepo.getProfileLevel(viewerId),
        deps.levelRepo.getProfileLevel(targetId),
        deps.levelRepo.getProfileLevels(targetId),
        deps.progressRepo.getProgress(targetId),
      ]);

      const fields = recordsToFields(profileLevels);
      const progress = calculateProgress({
        xp: rawProgress.xp,
        thresholds: rawProgress.thresholds,
        currentLevel: targetLevel,
      });

      const snapshot: ProfileSnapshot = buildProfileSnapshot({
        profileId,
        viewerLevel,
        targetLevel,
        fields,
        progress,
      });

      await deps.viewRepo.recordView({
        viewerId,
        targetId,
        levelExposed: snapshot.reciprocalLevel,
      });

      return snapshot;
    },
  };
}

function recordsToFields(records: ProfileLevelRecord[]): ProfileFieldsPayload {
  const payload: ProfileFieldsPayload = {
    basic: {},
    vibe: undefined,
    trust: undefined,
    intent: undefined,
  };

  records.forEach((record) => {
    switch (record.level) {
      case 'L1':
        payload.basic = record.data;
        break;
      case 'L2':
        payload.vibe = record.data;
        break;
      case 'L3':
        payload.trust = record.data;
        break;
      case 'L4':
        payload.intent = record.data;
        break;
      default:
        break;
    }
  });

  return payload;
}
