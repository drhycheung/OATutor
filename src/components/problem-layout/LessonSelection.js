import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import styles from './common-styles.js';
import IconButton from '@material-ui/core/IconButton';
import {
    _coursePlansNoEditor,
    ThemeContext,
    SITE_NAME,
    SHOW_COPYRIGHT,
    PROGRESS_STORAGE_KEY,
    LESSON_PROGRESS_STORAGE_KEY,
    MASTERY_THRESHOLD,
} from '../../config/config.js';
import Spacer from "../Spacer";
import {
    Typography,
    LinearProgress,
    CircularProgress,
    makeStyles,
} from "@material-ui/core";
import { IS_STAGING_OR_DEVELOPMENT } from "../../util/getBuildType";
import BuildTimeIndicator from "@components/BuildTimeIndicator";
import withTranslation from "../../util/withTranslation.js";
import MenuBookIcon from '@material-ui/icons/MenuBook';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AssessmentIcon from '@material-ui/icons/Assessment';
import { LocalizationConsumer } from '../../util/LocalizationContext';
import { withResponsive } from '../../util/ResponsiveContext';
import { withRouter } from "react-router-dom";
import { CONTENT_SOURCE } from "@common/global-config";

let problemPool = require(`@generated/processed-content-pool/${CONTENT_SOURCE}.json`);

const progressStyles = makeStyles((theme) => ({
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

function CourseProgressView({ courseCode, history }) {
    const classes = progressStyles();
    const context = useContext(ThemeContext);
    const [loaded, setLoaded] = useState(false);
    const [masteryMap, setMasteryMap] = useState({});
    const [done, setDone] = useState({});
    const [open, setOpen] = useState(null);

    const course = _coursePlansNoEditor.find((c) => c.courseCode === courseCode);

    const problemTotals = useMemo(() => {
        const counts = {};
        for (const p of problemPool) {
            if (p && p.lessonId) counts[p.lessonId] = (counts[p.lessonId] || 0) + 1;
        }
        return counts;
    }, []);

    useEffect(() => {
        if (!course) return;
        let cancelled = false;
        const load = async () => {
            const { getByKey } = context.browserStorage;
            const lessons = course.lessons;
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
        return () => { cancelled = true; };
    }, [course, context]);

    const rows = useMemo(() => {
        if (!course) return [];
        const byTopic = [];
        const metaLessons = Array.isArray(course.metaLessons) ? course.metaLessons : [];
        const metaLessonChildIds = new Set();
        metaLessons.forEach((m) => {
            (Array.isArray(m.lessons) ? m.lessons : []).forEach((childId) => metaLessonChildIds.add(childId));
        });
        const visibleLessons = course.lessons.filter(
            (lesson) => !metaLessonChildIds.has(lesson.metaId) && !metaLessonChildIds.has(lesson.id)
        );
        for (const lesson of visibleLessons) {
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

    const metaLessons = Array.isArray(course?.metaLessons) ? course.metaLessons : [];

    if (!loaded) {
        return (
            <Box textAlign="center" py={6}>
                <CircularProgress />
            </Box>
        );
    }

    return (
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
                <Typography variant="h5" style={{ fontWeight: 600, marginBottom: 8 }}>
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
                                                color: masteredAll ? "#18a058" : "#cbd5e1",
                                            }}
                                        >
                                            {pct}%
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            aria-label={`View all problems for lesson ${lesson.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                history.push(`/lessons/${lesson.id}/problems`);
                                            }}
                                        >
                                            <MenuBookIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            aria-label={`Start lesson ${lesson.id}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                history.push(`/lessons/${lesson.id}`);
                                            }}
                                        >
                                            <PlayArrowIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => e.stopPropagation()}
                                            aria-hidden
                                        >
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

            {metaLessons.length > 0 && (
                <>
                    <Typography variant="h5" component="h3" style={{ marginTop: 16, marginBottom: 8 }}>Meta Lessons</Typography>
                    {metaLessons.map((metaLesson) => (
                        <Paper key={metaLesson.id} className={classes.card} elevation={0} variant="outlined">
                            <div className={classes.lessonRow}>
                                <Box minWidth={0}>
                                    <Typography className={classes.lessonTitle}>
                                        {metaLesson.name || metaLesson.id}
                                    </Typography>
                                    <Typography variant="body2" className={classes.chipInline}>
                                        Meta lesson
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    aria-label={`Start meta lesson ${metaLesson.id}`}
                                    onClick={() => history.push(`/lessons/${metaLesson.id}`)}
                                >
                                    <PlayArrowIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </Paper>
                    ))}
                </>
            )}

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
    );
}

class LessonSelection extends React.Component {
    static contextType = ThemeContext;

    constructor(props, context) {
        super(props);

        this.user = context.user || {}
        this.isPrivileged = !!this.user.privileged

        this.coursePlans = _coursePlansNoEditor;

        this.state = {
            preparedRemoveProgress: false,
            removedProgress: false,
        }
    }

    removeProgress = () => {
        this.setState({ removedProgress: true });
        this.props.removeProgress();
    }

    prepareRemoveProgress = () => {
        this.setState({ preparedRemoveProgress: true });
    }

    handleCourseSelect = (course) => {
        const { history } = this.props;
        history.push(`/courses/${course.courseCode}`);
    };

    render() {
        const { translate } = this.props;
        const { classes, courseCode } = this.props;
        const isMobile = this.props.responsive?.isMobile ?? false;
        const selectionMode = courseCode == null ? "course" : "lesson"

        if (selectionMode === "lesson" && !this.coursePlans.some((c) => c.courseCode === courseCode)) {
            return <Box width={'100%'} textAlign={'center'} pt={4} pb={4}>
                <Typography variant={'h3'}>Course <code>{courseCode}</code> is not valid!</Typography>
            </Box>
        }

        return (
            <>
                <div>
                    <Grid
                        container
                        spacing={0}
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Box
                            width={isMobile ? "100%" : "75%"}
                            maxWidth={1500}
                            style={isMobile ? { paddingLeft: 16, paddingRight: 16 } : undefined}
                            role={"main"}
                        >
                            <center>
                                {selectionMode === "course"
                                    ? <>
                                        <h1>{translate('lessonSelection.welcomeTo')} {SITE_NAME}!</h1>
                                        <h2>{translate('lessonSelection.select')} {translate('lessonSelection.course')}</h2>
                                      </>
                                    : <>
                                        <h1>{this.coursePlans.find((c) => c.courseCode === courseCode)?.courseName}</h1>
                                        <h2>{this.coursePlans.find((c) => c.courseCode === courseCode)?.courseOER?.split('<')[0]?.trim() || ''}</h2>
                                      </>
                                }
                                {this.isPrivileged
                                    && <h4>(for {this.user.resource_link_title})</h4>
                                }
                                {
                                    IS_STAGING_OR_DEVELOPMENT && <BuildTimeIndicator/>
                                }
                            </center>
                            <Divider/>
                            <Spacer/>

                            {selectionMode === "course" ? (
                                <Grid container spacing={3}>
                                    {this.coursePlans
                                        .map((course, i) =>
                                            <Grid item xs={12} sm={6} md={4} key={course.courseName}>
                                                <center>
                                                    <Paper className={classes.paper} style={{ fontSize: "1rem", textAlign: "center" }}>
                                                        <h2 style={{
                                                            minHeight: "2.5em",
                                                            marginTop: "0.2em",
                                                            marginBottom: "0.4em",
                                                            textAlign: "center",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            wordBreak: "break-word",
                                                        }}>{course.courseName}</h2>
                                                        <IconButton aria-label={`View Course ${course.courseCode}`}
                                                            aria-roledescription={`Navigate to ${course.courseCode}'s page to view available lessons`}
                                                            role={"link"}
                                                            onClick={() => {
                                                                this.props.selectCourse(course);
                                                                this.props.history.push(`/courses/${course.courseCode}`)
                                                            }}>
                                                            <img
                                                                src={`${process.env.PUBLIC_URL}/static/images/icons/folder_outline_2.svg`}
                                                                alt="folderIcon"
                                                                style= {{ width: "2.6em" }}
                                                            />
                                                        </IconButton>
                                                    </Paper>
                                                </center>
                                            </Grid>
                                        )
                                    }
                                </Grid>
                            ) : (
                                <CourseProgressView courseCode={courseCode} history={this.props.history} />
                            )}

                            <Spacer/>
                        </Box>
                    </Grid>
                    <Spacer/>
                    <Grid container spacing={0}>
                        <Grid item xs={3} sm={3} md={5} key={1}/>
                        {!this.isPrivileged && <Grid item xs={6} sm={6} md={2} key={2}>
                            {this.state.preparedRemoveProgress ?
                                <Button className={classes.button} size="small"
                                        style={{ 
                                            width: "100%", 
                                            color: "#7EB6E0",
                                            backgroundColor: "transparent",
                                            border: "1px solid #5b93c9",
                                            boxShadow: "none"
                                        }} 
                                    onClick={this.removeProgress}
                                    disabled={this.state.removedProgress}>{this.state.removedProgress ? translate('lessonSelection.reset') : translate('lessonSelection.aresure')}</Button> :
                                <Button className={classes.button} size="small"
                                    style={{ 
                                        width: "100%", 
                                        color: "#7EB6E0",
                                        backgroundColor: "transparent",
                                        border: "1px solid #5b93c9",
                                        boxShadow: "none"
                                    }} 
                                    onClick={this.prepareRemoveProgress}
                                    disabled={this.state.preparedRemoveProgress}>{translate('lessonSelection.resetprogress')}</Button>}
                        </Grid>}
                        <Grid item xs={3} sm={3} md={4} key={3}/>
                    </Grid>
                    <Spacer/>
                </div>

                <footer>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <div style={{ marginLeft: 20, fontSize: 16 }}>
                            {SHOW_COPYRIGHT && <>© {new Date().getFullYear()} {SITE_NAME}</>}
                        </div>
                    </div>
                </footer>
            </>
        )
    }
}

export default withStyles(styles)(withResponsive(withTranslation((props) => (
    <LocalizationConsumer>
        {({ language, platformLanguage }) => (
            <LessonSelection
                {...props}
                language={language}
                platformLanguage={platformLanguage}
            />
        )}
    </LocalizationConsumer>
))));
