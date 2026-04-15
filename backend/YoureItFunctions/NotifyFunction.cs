using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using FirebaseAdmin.Messaging;

namespace YoureItFunctions;

public class NotifyFunction
{
    [Function("notify")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
    {
        var body = await req.ReadAsStringAsync();
        if (string.IsNullOrEmpty(body))
            return req.CreateResponse(HttpStatusCode.BadRequest);

        NotifyRequest? payload;
        try
        {
            payload = JsonSerializer.Deserialize<NotifyRequest>(body, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch { return req.CreateResponse(HttpStatusCode.BadRequest); }

        if (payload?.Tokens == null || payload.Tokens.Length == 0)
            return req.CreateResponse(HttpStatusCode.BadRequest);

        var tasks = new List<Task<BatchResponse>>();

        if (payload.Type == "tag")
        {
            var taggedTokens = payload.Tokens.Where(t => t.IsTagged).Select(t => t.Token).ToList();
            var otherTokens = payload.Tokens.Where(t => !t.IsTagged).Select(t => t.Token).ToList();

            if (taggedTokens.Any())
            {
                tasks.Add(FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(new MulticastMessage
                {
                    Tokens = taggedTokens,
                    Notification = new Notification { Title = "🏷️ You're IT!", Body = $"{payload.TaggerName} just tagged you. Run!" },
                    Webpush = Webpush("🏷️ You're IT!", $"{payload.TaggerName} just tagged you. Run!", new[] { 200, 100, 200, 100, 200 }),
                }));
            }
            if (otherTokens.Any())
            {
                var title = $"🏷️ {payload.TaggedName} is now IT!";
                var msg = $"{payload.TaggerName} just tagged {payload.TaggedName}. Run!";
                tasks.Add(FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(new MulticastMessage
                {
                    Tokens = otherTokens,
                    Notification = new Notification { Title = title, Body = msg },
                    Webpush = Webpush(title, msg, new[] { 100, 50, 100 }),
                }));
            }
        }
        else
        {
            string title, msg;
            int[]? vibrate = null;

            switch (payload.Type)
            {
                case "pause":
                    title = "⏸ Game Paused";
                    msg = $"{payload.ActorName} paused the game. Timer is frozen.";
                    break;
                case "resume":
                    title = "▶️ Game Resumed";
                    msg = $"{payload.ActorName} resumed the game. Clock is running!";
                    vibrate = new[] { 100, 50, 100 };
                    break;
                case "start":
                    title = "🏁 Game Started!";
                    msg = $"{payload.TaggedName} is the first one IT. Good luck!";
                    vibrate = new[] { 200, 100, 200 };
                    break;
                case "end":
                    title = "🏴 Game Over!";
                    msg = $"{payload.PlayerName} accumulated the most time and takes the punishment. 😈";
                    vibrate = new[] { 300, 100, 300 };
                    break;
                case "adjustment":
                    var sign = (payload.AdjustmentMs ?? 0) > 0 ? "+" : "-";
                    var mins = Math.Abs((payload.AdjustmentMs ?? 0) / 60000.0);
                    title = "⚖️ Time Adjusted";
                    msg = $"{payload.ActorName} adjusted {payload.PlayerName}'s time by {sign}{mins:F1} min.";
                    break;
                default:
                    title = "You're It";
                    msg = "Something happened in the game!";
                    break;
            }

            var allTokens = payload.Tokens.Select(t => t.Token).ToList();
            if (allTokens.Any())
            {
                tasks.Add(FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(new MulticastMessage
                {
                    Tokens = allTokens,
                    Notification = new Notification { Title = title, Body = msg },
                    Webpush = Webpush(title, msg, vibrate),
                }));
            }
        }

        var results = await Task.WhenAll(tasks);
        var successCount = results.Sum(r => r.SuccessCount);
        var failureCount = results.Sum(r => r.FailureCount);

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new { successCount, failureCount });
        return response;
    }

    private static WebpushConfig Webpush(string title, string body, int[]? vibrate = null) =>
        new WebpushConfig
        {
            Notification = new WebpushNotification
            {
                Title = title,
                Body = body,
                Icon = "/icon-192.png",
                Vibrate = vibrate,
            }
        };
}

public record TokenEntry(string Token, bool IsTagged);
public record NotifyRequest(
    TokenEntry[]? Tokens,
    string Type,
    string? TaggerName,
    string? TaggedName,
    string? ActorName,
    string? PlayerName,
    long? AdjustmentMs
);