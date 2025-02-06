import { describe, it, expect } from "vitest";
import { useTime, useRelativeTime } from "../../utils/useTime";

describe("useTime.ts", () => {
  // These tests aren't very useful.. maybe this shouldn't be a function ?
  describe("useTime", () => {
    const time = useTime();

    it("should have correct IMMIDIATE value", () => {
      expect(time.IMMIDIATE).toBe(0);
    });
    it("should have correct WAIT value", () => {
      expect(time.WAIT).toBe(10);
    });
    it("should have correct ERROR value", () => {
      expect(time.ERROR).toBe(3000);
    });
    it("should have correct POLL value", () => {
      expect(time.POLL).toBe(500);
    });

    it("should have correct MILLISECOND value", () => {
      expect(time.MILLISECOND).toBe(1);
    });
    it("should have correct SECOND value", () => {
      expect(time.SECOND).toBe(1000);
    });
    it("should have correct MINUTE value", () => {
      expect(time.MINUTE).toBe(60000);
    });
    it("should have correct HOUR value", () => {
      expect(time.HOUR).toBe(3600000);
    });
    it("should have correct DAY value", () => {
      expect(time.DAY).toBe(86400000);
    });
    it("should have correct WEEK value", () => {
      expect(time.WEEK).toBe(604800000);
    });
    it("should have correct MONTH value", () => {
      expect(time.MONTH).toBe(2592000000);
    });
    it("should have correct YEAR value", () => {
      expect(time.YEAR).toBe(31536000000);
    });
  });

  describe("useRelativeTime", () => {
    const now = Date.now();
    const time = useTime();

    it("should return null if timestamp argument is null", () => {
      // @ts-ignore
      expect(useRelativeTime(null, now)).toBeNull();
    });

    it("should return null if currentTime argument is null", () => {
      // @ts-ignore
      expect(useRelativeTime(now, null)).toBeNull();
    });
    it("should return null if currentTime argument is undefined", () => {
      // @ts-ignore
      expect(useRelativeTime(now, undefined)).toBeNull();
    });

    it('should return "now" if both arguments have the same time', () => {
      expect(useRelativeTime(now, now)).toBe("now");
    });

    it.skip("should handle seconds in the future and in the past", () => {
      expect(useRelativeTime(now - time.SECOND, now)).toBe("in 1 second");
      expect(useRelativeTime(now + time.SECOND, now)).toBe("1 second ago");
      expect(useRelativeTime(now - 2 * time.SECOND, now)).toBe("in 2 seconds");
      expect(useRelativeTime(now + 2 * time.SECOND, now)).toBe("2 seconds ago");
    });

    it.skip("should handle minutes in the future and in the past", () => {
      expect(useRelativeTime(now - time.MINUTE, now)).toBe("in 1 minute");
      expect(useRelativeTime(now + time.MINUTE, now)).toBe("1 minute ago");
      expect(useRelativeTime(now - 2 * time.MINUTE, now)).toBe("in 2 minutes");
      expect(useRelativeTime(now + 2 * time.MINUTE, now)).toBe("2 minutes ago");
    });

    it.skip("should handle hours in the future and in the past", () => {
      expect(useRelativeTime(now - time.HOUR, now)).toBe("in 1 hour");
      expect(useRelativeTime(now + time.HOUR, now)).toBe("1 hour ago");
      expect(useRelativeTime(now - 2 * time.HOUR, now)).toBe("in 2 hours");
      expect(useRelativeTime(now + 2 * time.HOUR, now)).toBe("2 hours ago");
    });

    it.skip("should format correctly for complex times in the future and in the past", () => {
      expect(
        useRelativeTime(now + time.HOUR + time.MINUTE + time.SECOND, now)
      ).toBe("in 1 hour and 1 minute and 1 second");
      expect(
        useRelativeTime(now - time.HOUR + time.MINUTE + time.SECOND, now)
      ).toBe("1 hour and 1 minute and 1 second ago");
      expect(
        useRelativeTime(
          now + 2 * time.HOUR + 2 * time.MINUTE + 2 * time.SECOND,
          now
        )
      ).toBe("in 2 hours and 2 minutes and 2 seconds");
      expect(
        useRelativeTime(
          now - 2 * time.HOUR + 2 * time.MINUTE + 2 * time.SECOND,
          now
        )
      ).toBe("2 hours and 2 minutes and 2 seconds ago");
    });
  });
});
