#!/usr/bin/env python3
"""
Technical analysis tool for stocks/ETFs using Ben Cowen framework.
Analyzes price data and generates alerts for trading opportunities.
"""

import json
import sys
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class PricePoint:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float

@dataclass
class Alert:
    type: str  # "support_broken", "resistance_tested", "ma_cross", "volume_spike", "opportunity"
    severity: str  # "critical", "high", "medium", "low"
    message: str
    data: dict

class TechnicalAnalyzer:
    def __init__(self, symbol: str, data: List[dict]):
        self.symbol = symbol
        self.data = [PricePoint(**d) for d in data]
        self.alerts: List[Alert] = []
        
    def calculate_sma(self, period: int) -> List[Optional[float]]:
        """Calculate Simple Moving Average."""
        sma = [None] * (period - 1)
        for i in range(period - 1, len(self.data)):
            avg = sum(p.close for p in self.data[i - period + 1:i + 1]) / period
            sma.append(avg)
        return sma
    
    def get_latest_sma(self, period: int) -> Optional[float]:
        """Get the latest SMA value."""
        sma = self.calculate_sma(period)
        return sma[-1] if sma and sma[-1] is not None else None
    
    def identify_swing_highs_lows(self, window: int = 5) -> dict:
        """Identify recent swing highs and lows."""
        if len(self.data) < window * 2:
            return {"highs": [], "lows": []}
        
        highs = []
        lows = []
        
        for i in range(window, len(self.data) - window):
            is_high = self.data[i].high == max(p.high for p in self.data[i-window:i+window+1])
            is_low = self.data[i].low == min(p.low for p in self.data[i-window:i+window+1])
            
            if is_high:
                highs.append({
                    "date": self.data[i].date,
                    "price": self.data[i].high
                })
            if is_low:
                lows.append({
                    "date": self.data[i].date,
                    "price": self.data[i].low
                })
        
        return {
            "highs": highs[-3:],  # Last 3 swing highs
            "lows": lows[-3:]     # Last 3 swing lows
        }
    
    def check_trend(self) -> str:
        """Determine current trend state."""
        if len(self.data) < 200:
            return "insufficient_data"
        
        sma20 = self.get_latest_sma(20)
        sma50 = self.get_latest_sma(50)
        sma200 = self.get_latest_sma(200)
        current_price = self.data[-1].close
        
        if sma20 and sma50 and sma200:
            if current_price > sma20 > sma50 > sma200:
                return "strong_uptrend"
            elif current_price < sma20 < sma50 < sma200:
                return "strong_downtrend"
            elif current_price > sma50 > sma200 and sma20 > sma50:
                return "uptrend"
            elif current_price < sma50 < sma200 and sma20 < sma50:
                return "downtrend"
        
        return "consolidation"
    
    def calculate_avg_volume(self, period: int = 20) -> float:
        """Calculate average volume over period."""
        if len(self.data) < period:
            period = len(self.data)
        return sum(p.volume for p in self.data[-period:]) / period
    
    def check_volume_spike(self, multiplier: float = 2.0) -> bool:
        """Check if latest volume is significantly higher than average."""
        avg_vol = self.calculate_avg_volume(20)
        current_vol = self.data[-1].volume
        return current_vol > (avg_vol * multiplier)
    
    def check_support_resistance(self) -> dict:
        """Identify current support and resistance levels."""
        swings = self.identify_swing_highs_lows()
        current_price = self.data[-1].close
        
        resistances = sorted([h["price"] for h in swings["highs"]], reverse=True)
        supports = sorted([l["price"] for l in swings["lows"]])
        
        # Add MAs as support/resistance
        sma20 = self.get_latest_sma(20)
        sma50 = self.get_latest_sma(50)
        sma200 = self.get_latest_sma(200)
        
        if sma20:
            supports.append(sma20) if sma20 < current_price else resistances.append(sma20)
        if sma50:
            supports.append(sma50) if sma50 < current_price else resistances.append(sma50)
        if sma200:
            supports.append(sma200) if sma200 < current_price else resistances.append(sma200)
        
        return {
            "current_price": current_price,
            "nearest_resistance": min(r for r in resistances if r > current_price) if resistances else None,
            "nearest_support": max(s for s in supports if s < current_price) if supports else None,
            "all_resistances": sorted(set(resistances), reverse=True)[:3],
            "all_supports": sorted(set(supports), reverse=True)[:3]
        }
    
    def generate_alerts(self) -> List[Alert]:
        """Analyze and generate trading alerts."""
        alerts = []
        
        # Trend alert
        trend = self.check_trend()
        if trend not in ["insufficient_data", "consolidation"]:
            alerts.append(Alert(
                type="trend",
                severity="medium",
                message=f"Current trend: {trend.replace('_', ' ').title()}",
                data={"trend": trend}
            ))
        
        # Volume spike alert
        if self.check_volume_spike(2.5):
            alerts.append(Alert(
                type="volume_spike",
                severity="high",
                message=f"Volume spike detected: {self.data[-1].volume:.0f} ({self.calculate_avg_volume(20):.0f} avg)",
                data={"current_volume": self.data[-1].volume, "avg_volume": self.calculate_avg_volume(20)}
            ))
        
        # Support/resistance analysis
        sr = self.check_support_resistance()
        if sr["nearest_resistance"]:
            distance_to_resistance = sr["nearest_resistance"] - sr["current_price"]
            pct_to_resistance = (distance_to_resistance / sr["current_price"]) * 100
            alerts.append(Alert(
                type="resistance_near",
                severity="medium" if pct_to_resistance < 3 else "low",
                message=f"Resistance at ${sr['nearest_resistance']:.2f} ({pct_to_resistance:.1f}% away)",
                data={"resistance": sr["nearest_resistance"], "distance_pct": pct_to_resistance}
            ))
        
        if sr["nearest_support"]:
            distance_to_support = sr["current_price"] - sr["nearest_support"]
            pct_to_support = (distance_to_support / sr["current_price"]) * 100
            alerts.append(Alert(
                type="support_near",
                severity="medium" if pct_to_support < 3 else "low",
                message=f"Support at ${sr['nearest_support']:.2f} ({pct_to_support:.1f}% away)",
                data={"support": sr["nearest_support"], "distance_pct": pct_to_support}
            ))
        
        return alerts
    
    def generate_report(self) -> dict:
        """Generate comprehensive analysis report."""
        if len(self.data) == 0:
            return {"error": "No price data provided"}
        
        latest = self.data[-1]
        trend = self.check_trend()
        sr = self.check_support_resistance()
        sma20 = self.get_latest_sma(20)
        sma50 = self.get_latest_sma(50)
        sma200 = self.get_latest_sma(200)
        
        return {
            "symbol": self.symbol,
            "analysis_date": datetime.now().isoformat(),
            "latest_price": latest.close,
            "price_change": latest.close - self.data[-2].close if len(self.data) > 1 else 0,
            "volume": latest.volume,
            "avg_volume_20d": self.calculate_avg_volume(20),
            "trend": trend,
            "moving_averages": {
                "sma_20": sma20,
                "sma_50": sma50,
                "sma_200": sma200
            },
            "support_resistance": {
                "current_price": sr["current_price"],
                "nearest_resistance": sr["nearest_resistance"],
                "nearest_support": sr["nearest_support"],
                "all_resistances": sr["all_resistances"],
                "all_supports": sr["all_supports"]
            },
            "alerts": [
                {
                    "type": a.type,
                    "severity": a.severity,
                    "message": a.message,
                    "data": a.data
                }
                for a in self.generate_alerts()
            ]
        }


def main():
    """CLI interface for price analysis."""
    if len(sys.argv) < 2:
        print("Usage: python analyze_price.py <symbol> [<json_data_file>]")
        print("\nExample JSON format:")
        print(json.dumps([{
            "date": "2026-04-18",
            "open": 160.0,
            "high": 161.5,
            "low": 158.0,
            "close": 159.69,
            "volume": 1000000
        }], indent=2))
        sys.exit(1)
    
    symbol = sys.argv[1]
    
    # Read from stdin or file
    if len(sys.argv) > 2:
        with open(sys.argv[2], 'r') as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)
    
    analyzer = TechnicalAnalyzer(symbol, data)
    report = analyzer.generate_report()
    
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
