import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, Thermometer, Navigation, TrendingUp, Loader2, CloudRain, Sun, Wind } from 'lucide-react';
import { createRecommendationEngine, Recommendation } from '../services/recommendationEngine';
import { fetchCurrentWeather, WeatherData, getRunningAdvice } from '../services/weatherService';
import DifficultyBadge from '../components/DifficultyBadge';

const Recommendations: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取当前时间段
  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('开始加载推荐...');

        // 获取当前天气
        console.log('获取天气数据...');
        const currentWeather = await fetchCurrentWeather();
        console.log('天气数据获取成功:', currentWeather);
        setWeather(currentWeather);

        // 使用临时用户ID（不依赖登录状态）
        const userId = 'guest-user-' + Date.now();
        console.log('使用用户ID:', userId);
        
        // 创建推荐引擎实例
        const engine = createRecommendationEngine(userId);
        console.log('推荐引擎创建成功');
        
        // 生成推荐
        const timeOfDay = getTimeOfDay();
        console.log('当前时段:', timeOfDay);
        const recs = await engine.generateRecommendations(currentWeather, timeOfDay, 6);
        console.log('推荐结果:', recs);
        
        setRecommendations(recs);
        console.log('推荐加载完成');
      } catch (err) {
        console.error('加载推荐失败:', err);
        setError('加载推荐失败: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const handleRouteClick = (routeId: string) => {
    navigate(`/route/${routeId}`);
  };

  const getRecommendationTypeLabel = (type: string): { label: string; color: string } => {
    const typeMap: Record<string, { label: string; color: string }> = {
      'perfect_match': { label: '完美匹配', color: 'bg-green-100 text-green-800' },
      'popular': { label: '热门路线', color: 'bg-blue-100 text-blue-800' },
      'challenge': { label: '挑战路线', color: 'bg-red-100 text-red-800' },
      'exploration': { label: '探索新路', color: 'bg-purple-100 text-purple-800' },
      'safe_night': { label: '夜跑安全', color: 'bg-indigo-100 text-indigo-800' },
      'general': { label: '推荐', color: 'bg-gray-100 text-gray-800' }
    };
    return typeMap[type] || typeMap['general'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">正在加载智能推荐...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 rounded-lg p-6 max-w-md">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能路线推荐</h1>
          <p className="text-gray-600">基于天气、时间和您的偏好为您推荐最佳跑步路线</p>
        </div>

        {/* 天气信息卡片 */}
        {weather && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white mb-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-6xl">{weather.icon}</div>
                <div>
                  <div className="text-4xl font-bold">{weather.temperature}°C</div>
                  <div className="text-blue-100">{weather.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex items-center">
                    <Wind className="h-5 w-5 mr-2" />
                    <span>{weather.windSpeed} km/h</span>
                  </div>
                  <div className="flex items-center">
                    <CloudRain className="h-5 w-5 mr-2" />
                    <span>{weather.humidity}%</span>
                  </div>
                </div>
                <div className="text-sm text-blue-100 bg-white/20 rounded-lg px-4 py-2">
                  {getRunningAdvice(weather)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 推荐路线列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => {
            const typeInfo = getRecommendationTypeLabel(rec.recommendation_type);
            return (
              <div
                key={rec.route.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => handleRouteClick(rec.route.id)}
              >
                {/* 推荐类型标签 */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 fill-current mr-1" />
                      <span className="text-sm font-medium">{rec.route.avg_rating}</span>
                      <span className="text-xs text-gray-500 ml-1">({rec.route.total_ratings})</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{rec.route.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{rec.route.description}</p>

                  {/* 路线信息 */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Navigation className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">{rec.route.distance} km</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">{rec.route.estimated_duration} 分钟</span>
                    </div>
                  </div>

                  {/* 难度标签 */}
                  <div className="mb-4">
                    <DifficultyBadge level={rec.route.difficulty_level} showLabel={true} />
                  </div>

                  {/* 推荐理由 */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-start">
                      <TrendingUp className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-blue-900 mb-1">
                          匹配度: {Math.round(rec.confidence_score * 100)}%
                        </div>
                        <div className="text-xs text-blue-700">{rec.reason || '综合推荐'}</div>
                      </div>
                    </div>
                  </div>

                  {/* 特征标签 */}
                  {rec.route.features && rec.route.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rec.route.features.slice(0, 3).map((feature: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 底部操作栏 */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRouteClick(rec.route.id);
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {recommendations.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无推荐路线</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              刷新推荐
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;