
const SCHOOL_INFO = `
【学校紹介情報】

const SCHOOL_INFO = `
【学校の基本情報】
学校名：福岡県立八女工業高等学校
公式サイト：https://yameth.fku.ed.jp/
所在地：福岡県筑後市大字羽犬塚301-4
電話番号：0942-53-2044
最寄り駅：JR羽犬塚駅
バス：羽犬塚駅前、羽犬塚小学校前から徒歩約6分
※アクセス情報は公式サイトの案内を参照してください。

【学科】
公式サイトの学科紹介に掲載されている学科：
・電子機械科
・IT自動車科／自動車科
・電気科
・情報技術科
・土木科
・工業化学科

学科名や募集学科は年度によって変更される可能性があります。
現在の募集学科、定員、入試条件については、
必ず最新年度の公式入試資料を確認してください。

【学習内容の概要】
電子機械科：
NC工作機械、コンピュータ、ロボット、CAD、
メカトロニクスなどの基礎的な知識・技術を学ぶ。

電気科：
電気の基礎理論から応用、電子分野やコンピュータまで
幅広く学ぶ。

情報技術科：
コンピュータの基礎理論や情報技術を学ぶ。
プログラミングや情報通信などの詳細は公式学科紹介を参照する。

土木科：
土木に関する基礎知識・技術を学び、
土木計画、設計、施工、管理などに関わる技術者を目指す。

工業化学科：
工業化学、化学工学、環境に関する知識を学び、
製造、分析、品質検査、環境保全などの分野を扱う。

IT自動車科／自動車科：
現在の学科名称、学年ごとの区分、学習内容については
最新の公式学科紹介・入試資料で確認する。

【部活動】
運動部、文化部、ものづくり系の研究部などがある。
公式サイトには陸上競技部、野球部、剣道部、卓球部、
山岳部、弓道部、バスケットボール部、ソフトテニス部、
吹奏楽部、美術部、書道部、茶華道部などが掲載されている。
電子機械研究部、自動車研究部、電気研究部、
情報技術研究部、土木研究部、工業化学研究部なども紹介されている。
最新の部活動一覧と活動状況は公式ページを参照する。

【学校生活・進路】
学校行事、学校生活、資格取得、就職・進学実績については、
公式サイトの最新資料を確認して回答する。
過去の進路実績を、今年度の進路実績として説明しない。

【情報の優先順位】
1. 最新年度の公式入試資料・公式発表
2. 公式サイトの該当学科・部活動・学校生活のページ
3. 公式サイト内の過去の資料

公式資料で確認できない情報は推測しない。
入試日程、募集定員、学費、資格、進路実績など、
年度で変わる情報は資料の年度を明示する。
`;

`;

const SYSTEM_PROMPT = `
あなたは学校を紹介する親しみやすいAI案内係です。
中学生や保護者にも分かりやすい日本語で回答してください。

ルール：
1. 学校紹介情報を優先して回答する。
2. 情報がない場合は、事実を作らず「手元の資料では確認できません」と伝える。
3. 入試日程や学費などは、最新の公式情報の確認を勧める。
4. 丁寧で親しみやすい口調にする。
5. 個人情報や非公開情報を推測して回答しない。

学校紹介情報：
${SCHOOL_INFO}
`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "POSTで質問を送信してください。"
    });
  }

  const token = process.env.OPENROUTER_API_KEY;

  if (!token) {
    return res.status(500).json({
      error: "OPENROUTER_API_KEYが設定されていません。"
    });
  }

  try {
    const body = req.body || {};
    const incoming = body.messages;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({
        error: "質問を入力してください。"
      });
    }

    const messages = incoming
      .filter(
        (m) =>
          m &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
      .slice(-12)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 3000)
      }));

    if (
      messages.length === 0 ||
      messages[messages.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "有効な質問が見つかりません。"
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "SchoolGuideAI"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages
          ],
          max_tokens: 600,
          temperature: 0.3
        })
      }
    );

    const raw = await response.text();
    let result;

    try {
      result = JSON.parse(raw);
    } catch {
      console.error(
        "OpenRouter returned non-JSON:",
        response.status,
        raw.slice(0, 300)
      );

      return res.status(502).json({
        error: "AIサービスから正しい応答を取得できませんでした。"
      });
    }

    if (!response.ok) {
      console.error(
        "OpenRouter error:",
        response.status,
        JSON.stringify(result).slice(0, 1000)
      );

      return res.status(502).json({
        error:
          result.error?.message ||
          "OpenRouterへの接続に失敗しました。APIキー、無料枠、モデルの利用可否を確認してください。"
      });
    }

  
const message = result.choices?.[0]?.message;
const answer = message?.content;

console.log("OpenRouter model:", result.model);
console.log("OpenRouter finish reason:", result.choices?.[0]?.finish_reason);
console.log("OpenRouter response type:", typeof answer);


    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({
        error: "AIから回答を取得できませんでした。"
      });
    }

    return res.status(200).json({
      answer: answer.trim()
    });
  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "サーバーでエラーが発生しました。"
    });
  }
}
