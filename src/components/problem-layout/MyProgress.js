import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  makeStyles,
  Paper,
  Toolbar,
  Typography,
} from "@material-ui/core";
import AssessmentIcon from "@material-ui/icons/Assessment";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { withRouter } from "react-router-dom";

import { CONTENT_SOURCE } from "@common/global-config";
import {
  ThemeContext,
  _coursePlansNoEditor,
  PROGRESS_STORAGE_KEY,
  LESSON_PROGRESS_STORAGE_KEY,
  MASTERY_THRESHOLD,
} from "../../config/config.js";

let problemPool = require(`@generated/processed-content-pool/${CONTENT_SOURCE}.json`);

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    minHeight: "100vh",
  },
  content: {
    maxWidth: 900,
    margin: "0 auto",
    padding: theme.spacing(3, 2),
  },
  backButton: {
    color: "#cbd5e1",
  },
  summaryCard: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  summaryMetric: {
    fontWeight: 600,
  },
  masterNumber: {
    color: "#18a058",
    fontWeight: 700,
  },
  topicHeader: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  card: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    cursor: "pointer",
  },
  lessonRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1),
  },
  lessonTitle: {
    fontWeight: 600,
  },
  chipInline: {
    fontSize: 13,
    color: "#94a3b8",
  },
  meterWrap: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    minWidth: 180,
  },
  skillRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1),
    padding: `${theme.spacing(0.5)}px 0`,
  },
  skillLabel: {
    flexShrink: 0,
    fontSize: 13,
  },
  skillBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(148, 163, 184, 0.25)",
    "& .MuiLinearProgress-bar": {
      backgroundColor: "#34d399",
    },
  },
  skillBarMastered: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(148, 163, 184, 0.25)",
    "& .MuiLinearProgress-bar": {
      backgroundColor: "#18a058",
    },
  },
}));

const skillLabel = (kc) =>
  kc.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function MyProgress({ history }) {
  const classes = useStyles();
  const context = useContext(ThemeContext);
  const [loaded, setLoaded] = useState(false);
  const [masteryMap, setMasteryMap] = useState({});
  const [done, setDone] = useState({});
  const [open, setOpen] = useState(null);

  const course = _coursePlansNoEditor[0];

  const problemTotals = useMemo(() => {
    const counts = {};
    for (const p of problemPool) {
      if (p && p.lessonId) counts[p.lessonId] = (counts[p.lessonId] || 0) + 1;
    }
    return counts;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { getByKey } = context.browserStorage;
      const lessons = course ? course.lessons : [];
      const [bkt, perLesson] = await Promise.all([
        getByKey(PROGRESS_STORAGE_KEY).catch(() => null),
        Promise.all(
          lessons.map((l) =>
            getByKey(LESSON_PROGRESS_STORAGE_KEY(l.id)).catch(() => null)
          )
        ),
      ]);
      if (cancelled) return;
      setMasteryMap(bkt && typeof bkt === "object" ? bkt : {});
      const counts = {};
      perLesson.forEach((arr, i) => {
        counts[lessons[i].id] = Array.isArray(arr) ? arr.length : 0;
      });
      setDone(counts);
      setLoaded(true);
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const rows = useMemo(() => {
    if (!course) return [];
    const byTopic = [];
    for (const lesson of course.lessons) {
      const skills = Object.keys(lesson.learningObjectives || {});
      const values = skills
        .map((k) => masteryMap[k]?.probMastery)
        .filter((m) => typeof m === "number" && !Number.isNaN(m));
      const mastery = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const mastered = skills.filter(
        (k) => (masteryMap[k]?.probMastery ?? 0) >= MASTERY_THRESHOLD
      ).length;
      const total = problemTotals[lesson.id] || 0;
      const completed = Math.min(done[lesson.id] || 0, total || Infinity);
      const topic = lesson.topics || "Other";
      let group = byTopic.find((g) => g.topic === topic);
      if (!group) {
        group = { topic, lessons: [] };
        byTopic.push(group);
      }
      group.lessons.push({ lesson, mastery, mastered, skillsCount: skills.length, completed, total });
    }
    return byTopic;
  }, [course, masteryMap, done, problemTotals]);

  const summary = useMemo(() => {
    const items = rows.flatMap((r) => r.lessons);
    const totalProblems = items.reduce((a, i) => a + i.total, 0);
    const totalDone = items.reduce((a, i) => a + i.completed, 0);
    const masteredTot = items.reduce((a, i) => a + i.mastered, 0);
    const skillsTot = items.reduce((a, i) => a + i.skillsCount, 0);
    const overall = items.length
      ? items.reduce((a, i) => a + i.mastery, 0) / items.length
      : 0;
    return { overall, totalProblems, totalDone, masteredTot, skillsTot };
  }, [rows]);

  return (
    <div className={classes.root}>
      <AppBar position="static" style={{ backgroundColor: "rgba(15, 23, 42, 0.9)" }}>
        <Toolbar>
          <IconButton
            aria-label="back to home"
            className={classes.backButton}
            onClick={() => history.push("/")}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" style={{ color: "#e2e8f0", fontWeight: 600 }}>
            My Progress
          </Typography>
        </Toolbar>
      </AppBar>

      <div className={classes.content} role="main">
        {!loaded ? (
          <Box textAlign="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper className={classes.summaryCard} elevation={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} style={{ textAlign: "center" }}>
                  <Typography variant="h2" className={classes.summaryMetric}>
                    <span className={classes.masterNumber}>
                      {Math.round(summary.overall * 100)}%
                    </span>
                  </Typography>
                  <Typography variant="body2" style={{ color: "#94a3b8" }}>
                    Overall mastery
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} style={{ textAlign: "center" }}>
                  <Typography variant="h2" className={classes.summaryMetric}>
                    <span style={{ color: "#60a5fa" }}>
                      {summary.totalDone}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "0.6em" }}>
                      {" / "}
                      {summary.totalProblems}
                    </span>
                  </Typography>
                  <Typography variant="body2" style={{ color: "#94a3b8" }}>
                    Problems completed
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4} style={{ textAlign: "center" }}>
                  <Typography variant="h2" className={classes.summaryMetric}>
                    <span style={{ color: "#60a5fa" }}>{summary.masteredTot}</span>
                    <span style={{ color: "#64748b", fontSize: "0.6em" }}>
                      {" / "}
                      {summary.skillsTot}
                    </span>
                  </Typography>
                  <Typography variant="body2" style={{ color: "#94a3b8" }}>
                    Learning objectives mastered
                  </Typography>
                </Grid>
              </Grid>
              <Divider style={{ margin: "16px 0 8px" }} />
              <Typography variant="body2" style={{ color: "#94a3b8", textAlign: "center" }}>
                Mastery threshold: {Math.round(MASTERY_THRESHOLD * 100)}% per objective. Progress is stored on this browser.
              </Typography>
            </Paper>

            {course && (
              <Typography variant="h5" style={{ fontWeight: 600 }}>
                {course.courseName}
              </Typography>
            )}

            {rows.map((group) => (
              <div key={group.topic}>
                <Typography variant="subtitle1" className={classes.topicHeader}>
                  {group.topic}
                </Typography>
                {group.lessons.map((item) => {
                  const { lesson, mastery, mastered, skillsCount, completed, total } = item;
                  const expanded = open === lesson.id;
                  const pct = Math.round(mastery * 100);
                  const masteredAll = skillsCount > 0 && mastered === skillsCount;
                  return (
                    <Paper
                      key={lesson.id}
                      className={classes.card}
                      elevation={0}
                      variant="outlined"
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : lesson.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setOpen(expanded ? null : lesson.id);
                        }
                      }}
                    >
                      <div className={classes.lessonRow}>
                        <Box minWidth={0} maxWidth="55%">
                          <Typography className={classes.lessonTitle}>
                            {lesson.name.replace(/##/g, "")}
                          </Typography>
                          <Typography variant="body2" className={classes.chipInline}>
                            {completed}/{total} problems · {mastered}/{skillsCount} objectives
                          </Typography>
                        </Box>
                        <div className={classes.meterWrap}>
                          <Box width="100%">
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              style={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "rgba(148, 163, 184, 0.25)",
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            style={{
                              fontWeight: 700,
                              minWidth: 42,
                              color: masteredAll ? "#18a058" : "#344054",
                            }}
                          >
                            {pct}%
                          </Typography>
                          <IconButton size="small" onClick={(e) => e.stopPropagation()} aria-hidden>
                            <ExpandMoreIcon
                              style={{
                                transform: expanded ? "rotate(180deg)" : "none",
                              }}
                            />
                          </IconButton>
                        </div>
                      </div>

                      {expanded && (
                        <Box mt={1}>
                          <Divider style={{ marginBottom: 8 }} />
                          {Object.keys(lesson.learningObjectives || {}).map((kc) => {
                            const m = masteryMap[kc]?.probMastery ?? 0;
                            const kpct = Math.round(m * 100);
                            const masteredKc = m >= MASTERY_THRESHOLD;
                            return (
                              <div className={classes.skillRow} key={kc}>
                                <Typography className={classes.skillLabel} style={{ color: masteredKc ? "#18a058" : "#cbd5e1" }}>
                                  {masteredKc ? "✓ " : ""}{skillLabel(kc)}
                                </Typography>
                                <div className={classes.meterWrap}>
                                  <Box width="100%">
                                    <LinearProgress
                                      variant="determinate"
                                      value={kpct}
                                      className={masteredKc ? classes.skillBarMastered : classes.skillBar}
                                    />
                                  </Box>
                                  <Typography variant="body2" style={{ fontWeight: 600, minWidth: 42 }}>
                                    {kpct}%
                                  </Typography>
                                </div>
                              </div>
                            );
                          })}
                          <Box mt={2} textAlign="right">
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                history.push(`/lessons/${lesson.id}`);
                              }}
                            >
                              Continue lesson
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </div>
            ))}

            {rows.length === 0 && (
              <Box textAlign="center" py={8}>
                <AssessmentIcon style={{ fontSize: 56, color: "#64748b" }} />
                <Typography variant="h6" style={{ marginTop: 8 }}>
                  No progress yet
                </Typography>
                <Typography variant="body2" style={{ color: "#94a3b8" }}>
                  Open a lesson and start practicing to see your progress here.
                </Typography>
              </Box>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withRouter(MyProgress);