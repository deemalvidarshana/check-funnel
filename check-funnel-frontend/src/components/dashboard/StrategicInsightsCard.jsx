const insights = [
  {
    name: "Elena V.",
    time: "2h ago",
    message:
      "Engagement spike detected in Northeast region campaign. Recommend doubling LinkedIn spend.",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDTS7A6rBGr_Jnw7-ohMRX_1gu875Axhuy6shnURrc8Cn_GPYItyrgJG00oj8kcMZANptI42a6f2UVcD3BxhhxZe7sfZeNH1U7WaqCSP7hRI-VYmVhxvemncKpNAaIvIj2utBYbGbH1XW3XrElkrLJsu4gJpaKla8MYB8sVL-xCR9Jl6GmiqNUFozmi0nWloeZVCnPLPmmor-qFg4xiNMyn96sVfpgV0jtqW6tgX7Wiu-lPcur2hVX0HMGeRg2rcOqHG4olVAMG3HhX",
  },
  {
    name: "Marcus L.",
    time: "5h ago",
    message:
      'Competitor "AnalytixHub" just launched a high-reach video series on YouTube. Impact assessment pending.',
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD71AULPibAZq4sQO8aEZ9S4yT36EIrqAOcGSN5jVnCvqvMnNn34Gl8CwbNGrmMvrzztmWSTBXxg8yN9zneUFu_w19aFZj7yHGi-t3rETGNUwFVPvppKRZ3qg3mQwszdAzfHCzFnCNfhk5BgcyLukgUTVgkHF33xRfhidw9scdTxPJZijA0fImG6TxQojib3vtBWk7E6ksfpboS1Ts-kmYJQ3d598r5y9zPM0JWrHV8l5rwyb9jjHS4JRKGkYIZDZRM289R24AnCJJM",
  },
];

export default function StrategicInsightsCard() {
  return (
    <section className="bg-slate-200/60 rounded-2xl p-8 border border-white/20">
      <h3 className="text-xl font-bold mb-8 text-slate-900">
        Strategic Insights & Alerts
      </h3>

      <div className="space-y-6">
        {insights.map((item) => (
          <div
            key={item.name}
            className="flex gap-4 p-4 bg-white/70 rounded-xl hover:bg-white transition-colors cursor-pointer"
          >
            <img
              src={item.avatar}
              alt={item.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {item.name}
                <span className="text-xs font-normal text-slate-500 ml-2">
                  {item.time}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {item.message}
              </p>
            </div>
          </div>
        ))}

        <div className="flex gap-4 p-4 bg-blue-900/5 rounded-xl border border-blue-900/10 hover:bg-blue-900/10 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white">
            ✨
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">
              AI Agent Alpha
              <span className="text-xs font-normal text-blue-900/70 ml-2">
                Just now
              </span>
            </p>
            <p className="text-xs text-blue-900/80 mt-1 leading-relaxed">
              Predictive model suggests 14% drop in SEO traffic next week if current crawling issues persist.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}