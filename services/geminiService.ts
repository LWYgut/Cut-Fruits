// Offline Evaluation Service
// Replaces the Gemini API call with local rule-based logic

export const generateGameFeedback = async (score: number, fruits: number, bombs: number): Promise<{ title: string; description: string }> => {
  // Simulate a short calculation delay for UI effect
  await new Promise(resolve => setTimeout(resolve, 800));

  // 1. Bomb Lover Check (High priority override for funny fail state)
  if (bombs >= 3) {
    return {
      title: "爆破鬼才",
      description: "艺术就是爆炸！比起切水果，你似乎更喜欢烟花。"
    };
  }

  // 2. Score < 100: Evaluation every 10 points
  if (score < 100) {
    const tier = Math.floor(score / 10);
    switch (tier) {
      case 0:
        return { title: "空气切割者", description: "你是来给水果扇风降温的吗？" };
      case 1:
        return { title: "厨房实习生", description: "拿刀的手法略显生涩，小心别切到手哦。" };
      case 2:
        return { title: "水果削皮工", description: "皮削得很干净，但我们需要的是切块！" };
      case 3:
        return { title: "沙拉制作员", description: "这份水果沙拉看起来很均匀，不错。" };
      case 4:
        return { title: "果汁学徒", description: "你是在切水果，还是在暴力榨汁？" };
      case 5:
        return { title: "初级忍者", description: "你已经摸到了忍道的门槛，继续努力。" };
      case 6:
        return { title: "锋利之刃", description: "刀法渐渐犀利起来了，水果开始颤抖。" };
      case 7:
        return { title: "疾手刺客", description: "你的手速很快，甚至有点看不清残影。" };
      case 8:
        return { title: "刀锋舞者", description: "切水果像在跳舞一样优雅，赏心悦目。" };
      case 9:
        return { title: "连击大师", description: "只差一点点就能突破百分大关了！加油！" };
      default:
        return { title: "初级忍者", description: "继续加油！" };
    }
  } 
  
  // 3. Score >= 100: Evaluation every 100 points
  else {
    const tier = Math.floor(score / 100);
    switch (tier) {
      case 1: // 100 - 199
        return { title: "疾风剑豪", description: "死亡如风，常伴吾身。你的刀很快！" };
      case 2: // 200 - 299
        return { title: "雷霆一击", description: "快如闪电，势如雷霆。无人能挡！" };
      case 3: // 300 - 399
        return { title: "影流之主", description: "无形之刃，最为致命。水果连影子都没看清就碎了。" };
      case 4: // 400 - 499
        return { title: "绝世剑神", description: "人剑合一，天下无双。你的传说将流芳百世。" };
      case 5: // 500 - 599
        return { title: "星系切割者", description: "你的刀光连星河都能切断，何况是区区水果。" };
      default: // 600+
        return { title: "宇宙传说", description: "这个维度已经没有水果能阻挡你了，你是神！" };
    }
  }
};