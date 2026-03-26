'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Settings, PollingConfig, PollingScheduleType } from '@/types';

const selectClass =
  'rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent';
const inputClass =
  'rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent';

export function SettingsForm() {
  const t = useTranslations('settings');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  // 폴링 스케줄 로컬 상태 (적용 버튼 전까지 서버에 저장하지 않음)
  const [scheduleType, setScheduleType] = useState<PollingScheduleType>('daily');
  const [intervalHours, setIntervalHours] = useState(1);
  const [time, setTime] = useState('07:00');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((res) => {
        setSettings(res.data);
        const p = res.data.polling as PollingConfig;
        setScheduleType(p.type ?? 'daily');
        setIntervalHours(p.intervalHours ?? 1);
        setTime(p.time ?? '07:00');
        setDayOfWeek(p.dayOfWeek ?? 0);
        setDayOfMonth(p.dayOfMonth ?? 1);
      });
  }, []);

  const save = async (patch: Partial<Settings>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      setSettings(data.data);
    } finally {
      setSaving(false);
    }
  };

  const applySchedule = async () => {
    const polling: PollingConfig = {
      ...settings!.polling,
      type: scheduleType,
      intervalHours,
      time,
      dayOfWeek,
      dayOfMonth,
    };
    await save({ polling });
    setDirty(false);
  };

  const markDirty = () => setDirty(true);

  const dayNames = [
    t('pollingMon'),
    t('pollingTue'),
    t('pollingWed'),
    t('pollingThu'),
    t('pollingFri'),
    t('pollingSat'),
    t('pollingSun'),
  ];

  if (!settings) {
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-surface" />;
  }

  return (
    <div className="space-y-6">
      {/* Polling */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold">{t('polling')}</h3>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.polling.enabled}
              onChange={(e) =>
                save({ polling: { ...settings.polling, enabled: e.target.checked } })
              }
              className="accent-accent"
            />
            <span className="text-sm">{t('pollingEnabled')}</span>
          </label>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">{t('pollingInterval')}</span>
              <select
                value={scheduleType}
                onChange={(e) => {
                  setScheduleType(e.target.value as PollingScheduleType);
                  markDirty();
                }}
                className={selectClass}
              >
                <option value="hourly">{t('pollingUnitHourly')}</option>
                <option value="daily">{t('pollingUnitDaily')}</option>
                <option value="weekly">{t('pollingUnitWeekly')}</option>
                <option value="monthly">{t('pollingUnitMonthly')}</option>
              </select>
            </div>

            {/* 매시간: N시간 입력 */}
            {scheduleType === 'hourly' && (
              <div className="flex items-center gap-3 pl-1">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={intervalHours}
                  onChange={(e) => {
                    setIntervalHours(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)));
                    markDirty();
                  }}
                  className={`w-16 ${inputClass}`}
                />
                <span className="text-sm text-muted">{t('pollingTime')}</span>
              </div>
            )}

            {/* 매일: 시간 선택 */}
            {scheduleType === 'daily' && (
              <div className="flex items-center gap-3 pl-1">
                <span className="text-sm text-muted">{t('pollingTime')}</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    markDirty();
                  }}
                  className={inputClass}
                />
              </div>
            )}

            {/* 매주: 요일 + 시간 */}
            {scheduleType === 'weekly' && (
              <div className="flex items-center gap-3 pl-1">
                <span className="text-sm text-muted">{t('pollingDayOfWeek')}</span>
                <select
                  value={dayOfWeek}
                  onChange={(e) => {
                    setDayOfWeek(parseInt(e.target.value));
                    markDirty();
                  }}
                  className={selectClass}
                >
                  {dayNames.map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-muted">{t('pollingTime')}</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    markDirty();
                  }}
                  className={inputClass}
                />
              </div>
            )}

            {/* 매월: 일 + 시간 */}
            {scheduleType === 'monthly' && (
              <div className="flex items-center gap-3 pl-1">
                <span className="text-sm text-muted">{t('pollingDayOfMonth')}</span>
                <select
                  value={dayOfMonth}
                  onChange={(e) => {
                    setDayOfMonth(parseInt(e.target.value));
                    markDirty();
                  }}
                  className={selectClass}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-muted">{t('pollingTime')}</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    markDirty();
                  }}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={applySchedule}
                className="rounded-md bg-accent px-4 py-1.5 text-sm text-white disabled:opacity-40"
              >
                {t('pollingApply')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="rounded-lg border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold">{t('aiSettings')}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-muted">{t('ollamaUrl')}</span>
            <input
              type="text"
              value={settings.ai.ollamaUrl}
              onChange={(e) => save({ ai: { ...settings.ai, ollamaUrl: e.target.value } })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted">{t('model')}</span>
            <input
              type="text"
              value={settings.ai.model}
              onChange={(e) => save({ ai: { ...settings.ai, model: e.target.value } })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
      </section>

      {saving && (
        <p className="text-center text-xs text-muted animate-pulse">Saving...</p>
      )}
    </div>
  );
}
