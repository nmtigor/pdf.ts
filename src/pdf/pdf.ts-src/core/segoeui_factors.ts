/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2021 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Factors to rescale LiberationSans-Bold.ttf to have the same
// metrics as segoeuib.ttf.
export const SegoeuiBoldFactors = [
  1.76738, 1, 1, 0.99297, 0.9824, 1.04016, 1.06497, 1.03424, 0.97529, 1.17647,
  1.23203, 1.1085, 1.1085, 1.16939, 1.2107, 0.9754, 1.21408, 0.9754, 1.59578,
  1.03424, 1.03424, 1.03424, 1.03424, 1.03424, 1.03424, 1.03424, 1.03424,
  1.03424, 1.03424, 0.81378, 0.81378, 1.2107, 1.2107, 1.2107, 0.71703, 0.97847,
  0.97363, 0.88776, 0.8641, 1.02096, 0.79795, 0.85132, 0.914, 1.06085, 1.1406,
  0.8007, 0.89858, 0.83693, 1.14889, 1.09398, 0.97489, 0.92094, 0.97489,
  0.90399, 0.84041, 0.95923, 1.00135, 1, 1.06467, 0.98243, 0.90996, 0.99361,
  1.1085, 1.56942, 1.1085, 1.2107, 0.74627, 0.94282, 0.96752, 1.01519, 0.86304,
  1.01359, 0.97278, 1.15103, 1.01359, 0.98561, 1.02285, 1.02285, 1.00527,
  1.02285, 1.0302, 0.99041, 1.0008, 1.01519, 1.01359, 1.02258, 0.79104, 1.16862,
  0.99041, 0.97454, 1.02511, 0.99298, 0.96752, 0.95801, 0.94856, 1.16579,
  0.94856, 1.2107, 0.9824, 1.03424, 1.03424, 1, 1.03424, 1.16579, 0.8727,
  1.3871, 1.18622, 1.10818, 1.04478, 1.2107, 1.18622, 0.75155, 0.94994, 1.28826,
  1.21408, 1.21408, 0.91056, 1, 0.91572, 0.9754, 0.64663, 1.18328, 1.24866,
  1.04478, 1.14169, 1.15749, 1.17389, 0.71703, 0.97363, 0.97363, 0.97363,
  0.97363, 0.97363, 0.97363, 0.93506, 0.8641, 0.79795, 0.79795, 0.79795,
  0.79795, 1.1406, 1.1406, 1.1406, 1.1406, 1.02096, 1.09398, 0.97426, 0.97426,
  0.97426, 0.97426, 0.97426, 1.2107, 0.97489, 1.00135, 1.00135, 1.00135,
  1.00135, 0.90996, 0.92094, 1.02798, 0.96752, 0.96752, 0.96752, 0.96752,
  0.96752, 0.96752, 0.93136, 0.86304, 0.97278, 0.97278, 0.97278, 0.97278,
  1.02285, 1.02285, 1.02285, 1.02285, 0.97122, 0.99041, 1, 1, 1, 1, 1, 1.28826,
  1.0008, 0.99041, 0.99041, 0.99041, 0.99041, 0.96752, 1.01519, 0.96752,
  0.97363, 0.96752, 0.97363, 0.96752, 0.97363, 0.96752, 0.8641, 0.86304, 0.8641,
  0.86304, 0.8641, 0.86304, 0.8641, 0.86304, 1.02096, 1.03057, 1.02096, 1.03517,
  0.79795, 0.97278, 0.79795, 0.97278, 0.79795, 0.97278, 0.79795, 0.97278,
  0.79795, 0.97278, 0.914, 1.01359, 0.914, 1.01359, 0.914, 1.01359, 1, 1,
  1.06085, 0.98561, 1.06085, 1.00879, 1.1406, 1.02285, 1.1406, 1.02285, 1.1406,
  1.02285, 1.1406, 1.02285, 1.1406, 1.02285, 0.97138, 1.08692, 0.8007, 1.02285,
  1, 1, 1.00527, 0.83693, 1.02285, 1, 1, 0.83693, 0.9455, 0.83693, 0.90418,
  0.83693, 1.13005, 1.09398, 0.99041, 1, 1, 1.09398, 0.99041, 0.96692, 1.09251,
  0.99041, 0.97489, 1.0008, 0.97489, 1.0008, 0.97489, 1.0008, 0.93994, 0.97931,
  0.90399, 1.02258, 1, 1, 0.90399, 1.02258, 0.84041, 0.79104, 0.84041, 0.79104,
  0.84041, 0.79104, 0.84041, 0.79104, 1, 1, 0.95923, 1.07034, 0.95923, 1.16862,
  1.00135, 0.99041, 1.00135, 0.99041, 1.00135, 0.99041, 1.00135, 0.99041,
  1.00135, 0.99041, 1.00135, 0.99041, 1.06467, 1.02511, 0.90996, 0.96752,
  0.90996, 0.99361, 0.95801, 0.99361, 0.95801, 0.99361, 0.95801, 1.07733,
  1.03424, 0.97363, 0.96752, 0.93506, 0.93136, 0.97489, 1.0008, 1, 1, 0.95923,
  1.16862, 1.15103, 1.15103, 1.01173, 1.03959, 0.75953, 0.81378, 0.79912,
  1.15103, 1.21994, 0.95161, 0.87815, 1.01149, 0.81525, 0.7676, 0.98167,
  1.01134, 1.02546, 0.84097, 1.03089, 1.18102, 0.97363, 0.88776, 0.85134,
  0.97826, 0.79795, 0.99361, 1.06085, 0.97489, 1.1406, 0.89858, 1.0388, 1.14889,
  1.09398, 0.86039, 0.97489, 1.0595, 0.92094, 0.94793, 0.95923, 0.90996,
  0.99346, 0.98243, 1.02112, 0.95493, 1.1406, 0.90996, 1.03574, 1.02597, 1.0008,
  1.18102, 1.06628, 1.03574, 1.0192, 1.01932, 1.00886, 0.97531, 1.0106, 1.0008,
  1.13189, 1.18102, 1.02277, 0.98683, 1.0016, 0.99561, 1.07237, 1.0008, 0.90434,
  0.99921, 0.93803, 0.8965, 1.23085, 1.06628, 1.04983, 0.96268, 1.0499, 0.98439,
  1.18102, 1.06628, 1.0008, 1.06628, 0.98439, 0.79795, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1.09466, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.97278, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.02065, 1, 1, 1, 1, 1, 1, 1.06467, 1.02511,
  1.06467, 1.02511, 1.06467, 1.02511, 0.90996, 0.96752, 1, 1.21408, 0.89903, 1,
  1, 0.75155, 1.04394, 1.04394, 1.04394, 1.04394, 0.98633, 0.98633, 0.98633,
  0.73047, 0.73047, 1.20642, 0.91211, 1.25635, 1.222, 1.02956, 1.03372, 1.03372,
  0.96039, 1.24633, 1, 1.12454, 0.93503, 1.03424, 1.19687, 1.03424, 1, 1, 1,
  0.771, 1, 1, 1.15749, 1.15749, 1.15749, 1.10948, 0.86279, 0.94434, 0.86279,
  0.94434, 0.86182, 1, 1, 1.16897, 1, 0.96085, 0.90137, 1.2107, 1.18416,
  1.13973, 0.69825, 0.9716, 2.10339, 1.29004, 1.29004, 1.21172, 1.29004,
  1.29004, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1.42603, 1, 0.99862, 0.99862, 1, 0.87025, 0.87025, 0.87025, 0.87025,
  1.18874, 1.42603, 1, 1.42603, 1.42603, 0.99862, 1, 1, 1, 1, 1, 1.2886,
  1.04315, 1.15296, 1.34163, 1, 1, 1, 1.09193, 1.09193, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];
export const SegoeuiBoldMetrics = { lineHeight: 1.33008, lineGap: 0 };

// Factors to rescale LiberationSans-BoldItalic.ttf to have the same
// metrics as segoeuiz.ttf.
export const SegoeuiBoldItalicFactors = [
  1.76738, 1, 1, 0.98946, 1.03959, 1.04016, 1.02809, 1.036, 0.97639, 1.10953,
  1.23203, 1.11144, 1.11144, 1.16939, 1.21237, 0.9754, 1.21261, 0.9754, 1.59754,
  1.036, 1.036, 1.036, 1.036, 1.036, 1.036, 1.036, 1.036, 1.036, 1.036, 0.81378,
  0.81378, 1.21237, 1.21237, 1.21237, 0.73541, 0.97847, 0.97363, 0.89723,
  0.87897, 1.0426, 0.79429, 0.85292, 0.91149, 1.05815, 1.1406, 0.79631, 0.90128,
  0.83853, 1.04396, 1.10615, 0.97552, 0.94436, 0.97552, 0.88641, 0.80527,
  0.96083, 1.00135, 1, 1.06777, 0.9817, 0.91142, 0.99361, 1.11144, 1.57293,
  1.11144, 1.21237, 0.74627, 1.31818, 1.06585, 0.97042, 0.83055, 0.97042,
  0.93503, 1.1261, 0.97042, 0.97922, 1.14236, 0.94552, 1.01054, 1.14236,
  1.02471, 0.97922, 0.94165, 0.97042, 0.97042, 1.0276, 0.78929, 1.1261, 0.97922,
  0.95874, 1.02197, 0.98507, 0.96752, 0.97168, 0.95107, 1.16579, 0.95107,
  1.21237, 1.03959, 1.036, 1.036, 1, 1.036, 1.16579, 0.87357, 1.31818, 1.18754,
  1.26781, 1.05356, 1.21237, 1.18622, 0.79487, 0.94994, 1.29004, 1.24047,
  1.24047, 1.31818, 1, 0.91484, 0.9754, 1.31818, 1.1349, 1.24866, 1.05356,
  1.13934, 1.15574, 1.17389, 0.73541, 0.97363, 0.97363, 0.97363, 0.97363,
  0.97363, 0.97363, 0.94385, 0.87897, 0.79429, 0.79429, 0.79429, 0.79429,
  1.1406, 1.1406, 1.1406, 1.1406, 1.0426, 1.10615, 0.97552, 0.97552, 0.97552,
  0.97552, 0.97552, 1.21237, 0.97552, 1.00135, 1.00135, 1.00135, 1.00135,
  0.91142, 0.94436, 0.98721, 1.06585, 1.06585, 1.06585, 1.06585, 1.06585,
  1.06585, 0.96705, 0.83055, 0.93503, 0.93503, 0.93503, 0.93503, 1.14236,
  1.14236, 1.14236, 1.14236, 0.93125, 0.97922, 0.94165, 0.94165, 0.94165,
  0.94165, 0.94165, 1.29004, 0.94165, 0.97922, 0.97922, 0.97922, 0.97922,
  0.96752, 0.97042, 0.96752, 0.97363, 1.06585, 0.97363, 1.06585, 0.97363,
  1.06585, 0.87897, 0.83055, 0.87897, 0.83055, 0.87897, 0.83055, 0.87897,
  0.83055, 1.0426, 1.0033, 1.0426, 0.97042, 0.79429, 0.93503, 0.79429, 0.93503,
  0.79429, 0.93503, 0.79429, 0.93503, 0.79429, 0.93503, 0.91149, 0.97042,
  0.91149, 0.97042, 0.91149, 0.97042, 1, 1, 1.05815, 0.97922, 1.05815, 0.97922,
  1.1406, 1.14236, 1.1406, 1.14236, 1.1406, 1.14236, 1.1406, 1.14236, 1.1406,
  1.14236, 0.97441, 1.04302, 0.79631, 1.01582, 1, 1, 1.01054, 0.83853, 1.14236,
  1, 1, 0.83853, 1.09125, 0.83853, 0.90418, 0.83853, 1.19508, 1.10615, 0.97922,
  1, 1, 1.10615, 0.97922, 1.01034, 1.10466, 0.97922, 0.97552, 0.94165, 0.97552,
  0.94165, 0.97552, 0.94165, 0.91602, 0.91981, 0.88641, 1.0276, 1, 1, 0.88641,
  1.0276, 0.80527, 0.78929, 0.80527, 0.78929, 0.80527, 0.78929, 0.80527,
  0.78929, 1, 1, 0.96083, 1.05403, 0.95923, 1.16862, 1.00135, 0.97922, 1.00135,
  0.97922, 1.00135, 0.97922, 1.00135, 0.97922, 1.00135, 0.97922, 1.00135,
  0.97922, 1.06777, 1.02197, 0.91142, 0.96752, 0.91142, 0.99361, 0.97168,
  0.99361, 0.97168, 0.99361, 0.97168, 1.23199, 1.036, 0.97363, 1.06585, 0.94385,
  0.96705, 0.97552, 0.94165, 1, 1, 0.96083, 1.1261, 1.31818, 1.31818, 1.31818,
  1.31818, 1.31818, 1.31818, 1.31818, 1.31818, 1.31818, 0.95161, 1.27126,
  1.00811, 0.83284, 0.77702, 0.99137, 0.95253, 1.0347, 0.86142, 1.07205,
  1.14236, 0.97363, 0.89723, 0.86869, 1.09818, 0.79429, 0.99361, 1.05815,
  0.97552, 1.1406, 0.90128, 1.06662, 1.04396, 1.10615, 0.84918, 0.97552,
  1.04694, 0.94436, 0.98015, 0.96083, 0.91142, 1.00356, 0.9817, 1.01945,
  0.98999, 1.1406, 0.91142, 1.04961, 0.9898, 1.00639, 1.14236, 1.07514, 1.04961,
  0.99607, 1.02897, 1.008, 0.9898, 0.95134, 1.00639, 1.11121, 1.14236, 1.00518,
  0.97981, 1.02186, 1, 1.08578, 0.94165, 0.99314, 0.98387, 0.93028, 0.93377,
  1.35125, 1.07514, 1.10687, 0.93491, 1.04232, 1.00351, 1.14236, 1.07514,
  0.94165, 1.07514, 1.00351, 0.79429, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1.09097, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.93503, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 0.96609, 1, 1, 1, 1, 1, 1, 1.06777, 1.02197, 1.06777,
  1.02197, 1.06777, 1.02197, 0.91142, 0.96752, 1, 1.21261, 0.89903, 1, 1,
  0.75155, 1.04745, 1.04745, 1.04745, 1.04394, 0.98633, 0.98633, 0.98633,
  0.72959, 0.72959, 1.20502, 0.91406, 1.26514, 1.222, 1.02956, 1.03372, 1.03372,
  0.96039, 1.24633, 1, 1.09125, 0.93327, 1.03336, 1.16541, 1.036, 1, 1, 1,
  0.771, 1, 1, 1.15574, 1.15574, 1.15574, 1.15574, 0.86364, 0.94434, 0.86279,
  0.94434, 0.86224, 1, 1, 1.16798, 1, 0.96085, 0.90068, 1.21237, 1.18416,
  1.13904, 0.69825, 0.9716, 2.10339, 1.29004, 1.29004, 1.21339, 1.29004,
  1.29004, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1.42603, 1, 0.99862, 0.99862, 1, 0.87025, 0.87025, 0.87025, 0.87025,
  1.18775, 1.42603, 1, 1.42603, 1.42603, 0.99862, 1, 1, 1, 1, 1, 1.2886,
  1.04315, 1.15296, 1.34163, 1, 1, 1, 1.13269, 1.13269, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];
export const SegoeuiBoldItalicMetrics = { lineHeight: 1.33008, lineGap: 0 };

// Factors to rescale LiberationSans-Italic.ttf to have the same
// metrics as segoeuii.ttf.
export const SegoeuiItalicFactors = [
  1.76738, 1, 1, 0.98946, 1.14763, 1.05365, 1.06234, 0.96927, 0.92586, 1.15373,
  1.18414, 0.91349, 0.91349, 1.07403, 1.17308, 0.78383, 1.20088, 0.78383,
  1.42531, 0.96927, 0.96927, 0.96927, 0.96927, 0.96927, 0.96927, 0.96927,
  0.96927, 0.96927, 0.96927, 0.78383, 0.78383, 1.17308, 1.17308, 1.17308,
  0.77349, 0.94565, 0.94729, 0.85944, 0.88506, 0.9858, 0.74817, 0.80016,
  0.88449, 0.98039, 0.95782, 0.69238, 0.89898, 0.83231, 0.98183, 1.03989,
  0.96924, 0.86237, 0.96924, 0.80595, 0.74524, 0.86091, 0.95402, 0.94143,
  0.98448, 0.8858, 0.83089, 0.93285, 1.0949, 1.39016, 1.0949, 1.45994, 0.74627,
  1.04839, 0.97454, 0.97454, 0.87207, 0.97454, 0.87533, 1.06151, 0.97454,
  1.00176, 1.16484, 1.08132, 0.98047, 1.16484, 1.02989, 1.01054, 0.96225,
  0.97454, 0.97454, 1.06598, 0.79004, 1.16344, 1.00351, 0.94629, 0.9973,
  0.91016, 0.96777, 0.9043, 0.91082, 0.92481, 0.91082, 1.17308, 0.95748,
  0.96927, 0.96927, 1, 0.96927, 0.92481, 0.80597, 1.04839, 1.23393, 1.1781,
  0.9245, 1.17308, 1.20808, 0.63218, 0.94261, 1.24822, 1.09971, 1.09971,
  1.04839, 1, 0.85273, 0.78032, 1.04839, 1.09971, 1.22326, 0.9245, 1.09836,
  1.13525, 1.15222, 0.70424, 0.94729, 0.94729, 0.94729, 0.94729, 0.94729,
  0.94729, 0.85498, 0.88506, 0.74817, 0.74817, 0.74817, 0.74817, 0.95782,
  0.95782, 0.95782, 0.95782, 0.9858, 1.03989, 0.96924, 0.96924, 0.96924,
  0.96924, 0.96924, 1.17308, 0.96924, 0.95402, 0.95402, 0.95402, 0.95402,
  0.83089, 0.86237, 0.88409, 0.97454, 0.97454, 0.97454, 0.97454, 0.97454,
  0.97454, 0.92916, 0.87207, 0.87533, 0.87533, 0.87533, 0.87533, 0.93146,
  0.93146, 0.93146, 0.93146, 0.93854, 1.01054, 0.96225, 0.96225, 0.96225,
  0.96225, 0.96225, 1.24822, 0.8761, 1.00351, 1.00351, 1.00351, 1.00351,
  0.96777, 0.97454, 0.96777, 0.94729, 0.97454, 0.94729, 0.97454, 0.94729,
  0.97454, 0.88506, 0.87207, 0.88506, 0.87207, 0.88506, 0.87207, 0.88506,
  0.87207, 0.9858, 0.95391, 0.9858, 0.97454, 0.74817, 0.87533, 0.74817, 0.87533,
  0.74817, 0.87533, 0.74817, 0.87533, 0.74817, 0.87533, 0.88449, 0.97454,
  0.88449, 0.97454, 0.88449, 0.97454, 1, 1, 0.98039, 1.00176, 0.98039, 1.00176,
  0.95782, 0.93146, 0.95782, 0.93146, 0.95782, 0.93146, 0.95782, 1.16484,
  0.95782, 0.93146, 0.84421, 1.12761, 0.69238, 1.08132, 1, 1, 0.98047, 0.83231,
  1.16484, 1, 1, 0.84723, 1.04861, 0.84723, 0.78755, 0.83231, 1.23736, 1.03989,
  1.01054, 1, 1, 1.03989, 1.01054, 0.9857, 1.03849, 1.01054, 0.96924, 0.96225,
  0.96924, 0.96225, 0.96924, 0.96225, 0.92383, 0.90171, 0.80595, 1.06598, 1, 1,
  0.80595, 1.06598, 0.74524, 0.79004, 0.74524, 0.79004, 0.74524, 0.79004,
  0.74524, 0.79004, 1, 1, 0.86091, 1.02759, 0.85771, 1.16344, 0.95402, 1.00351,
  0.95402, 1.00351, 0.95402, 1.00351, 0.95402, 1.00351, 0.95402, 1.00351,
  0.95402, 1.00351, 0.98448, 0.9973, 0.83089, 0.96777, 0.83089, 0.93285, 0.9043,
  0.93285, 0.9043, 0.93285, 0.9043, 1.31868, 0.96927, 0.94729, 0.97454, 0.85498,
  0.92916, 0.96924, 0.8761, 1, 1, 0.86091, 1.16344, 1.04839, 1.04839, 1.04839,
  1.04839, 1.04839, 1.04839, 1.04839, 1.04839, 1.04839, 0.81965, 0.81965,
  0.94729, 0.78032, 0.71022, 0.90883, 0.84171, 0.99877, 0.77596, 1.05734, 1.2,
  0.94729, 0.85944, 0.82791, 0.9607, 0.74817, 0.93285, 0.98039, 0.96924,
  0.95782, 0.89898, 0.98316, 0.98183, 1.03989, 0.78614, 0.96924, 0.97642,
  0.86237, 0.86075, 0.86091, 0.83089, 0.90082, 0.8858, 0.97296, 1.01284,
  0.95782, 0.83089, 1.0976, 1.04, 1.03342, 1.2, 1.0675, 1.0976, 0.98205,
  1.03809, 1.05097, 1.04, 0.95364, 1.03342, 1.05401, 1.2, 1.02148, 1.0119,
  1.04724, 1.0127, 1.02732, 0.96225, 0.8965, 0.97783, 0.93574, 0.94818, 1.30679,
  1.0675, 1.11826, 0.99821, 1.0557, 1.0326, 1.2, 1.0675, 0.96225, 1.0675,
  1.0326, 0.74817, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.03754, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 0.87533, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  0.98705, 1, 1, 1, 1, 1, 1, 0.98448, 0.9973, 0.98448, 0.9973, 0.98448, 0.9973,
  0.83089, 0.96777, 1, 1.20088, 0.89903, 1, 1, 0.75155, 0.94945, 0.94945,
  0.94945, 0.94945, 1.12317, 1.12317, 1.12317, 0.67603, 0.67603, 1.15621,
  0.73584, 1.21191, 1.22135, 1.06483, 0.94868, 0.94868, 0.95996, 1.24633, 1,
  1.07497, 0.87709, 0.96927, 1.01473, 0.96927, 1, 1, 1, 0.77295, 1, 1, 1.09836,
  1.09836, 1.09836, 1.01522, 0.86321, 0.94434, 0.8649, 0.94434, 0.86182, 1, 1,
  1.083, 1, 0.91578, 0.86438, 1.17308, 1.18416, 1.14589, 0.69825, 0.97622,
  1.96791, 1.24822, 1.24822, 1.17308, 1.24822, 1.24822, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.42603, 1, 0.99862,
  0.99862, 1, 0.87025, 0.87025, 0.87025, 0.87025, 1.17984, 1.42603, 1, 1.42603,
  1.42603, 0.99862, 1, 1, 1, 1, 1, 1.2886, 1.04315, 1.15296, 1.34163, 1, 1, 1,
  1.10742, 1.10742, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];
export const SegoeuiItalicMetrics = { lineHeight: 1.33008, lineGap: 0 };

// Factors to rescale LiberationSans-Regular.ttf to have the same
// metrics as segoeui.ttf.
export const SegoeuiRegularFactors = [
  1.76738, 1, 1, 0.98594, 1.02285, 1.10454, 1.06234, 0.96927, 0.92037, 1.19985,
  1.2046, 0.90616, 0.90616, 1.07152, 1.1714, 0.78032, 1.20088, 0.78032, 1.40246,
  0.96927, 0.96927, 0.96927, 0.96927, 0.96927, 0.96927, 0.96927, 0.96927,
  0.96927, 0.96927, 0.78032, 0.78032, 1.1714, 1.1714, 1.1714, 0.80597, 0.94084,
  0.96706, 0.85944, 0.85734, 0.97093, 0.75842, 0.79936, 0.88198, 0.9831,
  0.95782, 0.71387, 0.86969, 0.84636, 1.07796, 1.03584, 0.96924, 0.83968,
  0.96924, 0.82826, 0.79649, 0.85771, 0.95132, 0.93119, 0.98965, 0.88433,
  0.8287, 0.93365, 1.08612, 1.3638, 1.08612, 1.45786, 0.74627, 0.80499, 0.91484,
  1.05707, 0.92383, 1.05882, 0.9403, 1.12654, 1.05882, 1.01756, 1.09011,
  1.09011, 0.99414, 1.09011, 1.034, 1.01756, 1.05356, 1.05707, 1.05882, 1.04399,
  0.84863, 1.21968, 1.01756, 0.95801, 1.00068, 0.91797, 0.96777, 0.9043,
  0.90351, 0.92105, 0.90351, 1.1714, 0.85337, 0.96927, 0.96927, 0.99912,
  0.96927, 0.92105, 0.80597, 1.2434, 1.20808, 1.05937, 0.90957, 1.1714, 1.20808,
  0.75155, 0.94261, 1.24644, 1.09971, 1.09971, 0.84751, 1, 0.85273, 0.78032,
  0.61584, 1.05425, 1.17914, 0.90957, 1.08665, 1.11593, 1.14169, 0.73381,
  0.96706, 0.96706, 0.96706, 0.96706, 0.96706, 0.96706, 0.86035, 0.85734,
  0.75842, 0.75842, 0.75842, 0.75842, 0.95782, 0.95782, 0.95782, 0.95782,
  0.97093, 1.03584, 0.96924, 0.96924, 0.96924, 0.96924, 0.96924, 1.1714,
  0.96924, 0.95132, 0.95132, 0.95132, 0.95132, 0.8287, 0.83968, 0.89049,
  0.91484, 0.91484, 0.91484, 0.91484, 0.91484, 0.91484, 0.93575, 0.92383,
  0.9403, 0.9403, 0.9403, 0.9403, 0.8717, 0.8717, 0.8717, 0.8717, 1.00527,
  1.01756, 1.05356, 1.05356, 1.05356, 1.05356, 1.05356, 1.24644, 0.95923,
  1.01756, 1.01756, 1.01756, 1.01756, 0.96777, 1.05707, 0.96777, 0.96706,
  0.91484, 0.96706, 0.91484, 0.96706, 0.91484, 0.85734, 0.92383, 0.85734,
  0.92383, 0.85734, 0.92383, 0.85734, 0.92383, 0.97093, 1.0969, 0.97093,
  1.05882, 0.75842, 0.9403, 0.75842, 0.9403, 0.75842, 0.9403, 0.75842, 0.9403,
  0.75842, 0.9403, 0.88198, 1.05882, 0.88198, 1.05882, 0.88198, 1.05882, 1, 1,
  0.9831, 1.01756, 0.9831, 1.01756, 0.95782, 0.8717, 0.95782, 0.8717, 0.95782,
  0.8717, 0.95782, 1.09011, 0.95782, 0.8717, 0.84784, 1.11551, 0.71387, 1.09011,
  1, 1, 0.99414, 0.84636, 1.09011, 1, 1, 0.84636, 1.0536, 0.84636, 0.94298,
  0.84636, 1.23297, 1.03584, 1.01756, 1, 1, 1.03584, 1.01756, 1.00323, 1.03444,
  1.01756, 0.96924, 1.05356, 0.96924, 1.05356, 0.96924, 1.05356, 0.93066,
  0.98293, 0.82826, 1.04399, 1, 1, 0.82826, 1.04399, 0.79649, 0.84863, 0.79649,
  0.84863, 0.79649, 0.84863, 0.79649, 0.84863, 1, 1, 0.85771, 1.17318, 0.85771,
  1.21968, 0.95132, 1.01756, 0.95132, 1.01756, 0.95132, 1.01756, 0.95132,
  1.01756, 0.95132, 1.01756, 0.95132, 1.01756, 0.98965, 1.00068, 0.8287,
  0.96777, 0.8287, 0.93365, 0.9043, 0.93365, 0.9043, 0.93365, 0.9043, 1.08571,
  0.96927, 0.96706, 0.91484, 0.86035, 0.93575, 0.96924, 0.95923, 1, 1, 0.85771,
  1.21968, 1.11437, 1.11437, 0.93109, 0.91202, 0.60411, 0.84164, 0.55572,
  1.01173, 0.97361, 0.81818, 0.81818, 0.96635, 0.78032, 0.72727, 0.92366,
  0.98601, 1.03405, 0.77968, 1.09799, 1.2, 0.96706, 0.85944, 0.85638, 0.96491,
  0.75842, 0.93365, 0.9831, 0.96924, 0.95782, 0.86969, 0.94152, 1.07796,
  1.03584, 0.78437, 0.96924, 0.98715, 0.83968, 0.83491, 0.85771, 0.8287,
  0.94492, 0.88433, 0.9287, 1.0098, 0.95782, 0.8287, 1.0625, 0.98248, 1.03424,
  1.2, 1.01071, 1.0625, 0.95246, 1.03809, 1.04912, 0.98248, 1.00221, 1.03424,
  1.05443, 1.2, 1.04785, 0.99609, 1.00169, 1.05176, 0.99346, 1.05356, 0.9087,
  1.03004, 0.95542, 0.93117, 1.23362, 1.01071, 1.07831, 1.02512, 1.05205,
  1.03502, 1.2, 1.01071, 1.05356, 1.01071, 1.03502, 0.75842, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1.03719, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.9403,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.04021, 1, 1, 1, 1, 1, 1, 0.98965,
  1.00068, 0.98965, 1.00068, 0.98965, 1.00068, 0.8287, 0.96777, 1, 1.20088,
  0.89903, 1, 1, 0.75155, 1.03077, 1.03077, 1.03077, 1.03077, 1.13196, 1.13196,
  1.13196, 0.67428, 0.67428, 1.16039, 0.73291, 1.20996, 1.22135, 1.06483,
  0.94868, 0.94868, 0.95996, 1.24633, 1, 1.07497, 0.87796, 0.96927, 1.01518,
  0.96927, 1, 1, 1, 0.77295, 1, 1, 1.10539, 1.10539, 1.11358, 1.06967, 0.86279,
  0.94434, 0.86279, 0.94434, 0.86182, 1, 1, 1.083, 1, 0.91578, 0.86507, 1.1714,
  1.18416, 1.14589, 0.69825, 0.97622, 1.9697, 1.24822, 1.24822, 1.17238,
  1.24822, 1.24822, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1.42603, 1, 0.99862, 0.99862, 1, 0.87025, 0.87025, 0.87025,
  0.87025, 1.18083, 1.42603, 1, 1.42603, 1.42603, 0.99862, 1, 1, 1, 1, 1,
  1.2886, 1.04315, 1.15296, 1.34163, 1, 1, 1, 1.10938, 1.10938, 1, 1, 1,
  1.05425, 1.09971, 1.09971, 1.09971, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];
export const SegoeuiRegularMetrics = { lineHeight: 1.33008, lineGap: 0 };
/*81---------------------------------------------------------------------------*/
